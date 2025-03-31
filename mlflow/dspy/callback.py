import logging
import threading
from collections import defaultdict
from functools import wraps
from typing import Any, Optional, Union

import dspy
from dspy.utils.callback import BaseCallback

import mlflow
from mlflow.dspy.save import FLAVOR_NAME
from mlflow.dspy.util import log_dspy_module_params, save_dspy_module_state
from mlflow.entities import SpanStatusCode, SpanType
from mlflow.entities.run_status import RunStatus
from mlflow.entities.span_event import SpanEvent
from mlflow.exceptions import MlflowException
from mlflow.models.model import _MODEL_TRACKER
from mlflow.pyfunc.context import get_prediction_context, maybe_set_prediction_context
from mlflow.tracing.constant import SpanAttributeKey
from mlflow.tracing.provider import detach_span_from_context, set_span_in_context
from mlflow.tracing.utils import (
    end_client_span_or_trace,
    set_span_chat_messages,
    start_client_span_or_trace,
)
from mlflow.tracing.utils.token import SpanWithToken
from mlflow.utils.autologging_utils import (
    get_autologging_config,
)

_logger = logging.getLogger(__name__)
_lock = threading.Lock()


def skip_if_trace_disabled(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if get_autologging_config(FLAVOR_NAME, "log_traces"):
            func(*args, **kwargs)

    return wrapper


class MlflowCallback(BaseCallback):
    """Callback for generating MLflow traces for DSPy components"""

    def __init__(self, dependencies_schema: Optional[dict[str, Any]] = None):
        self._client = mlflow.MlflowClient()
        self._dependencies_schema = dependencies_schema
        # call_id: (LiveSpan, OTel token)
        self._call_id_to_span: dict[str, SpanWithToken] = {}

        ###### state management for optimization process ######
        # The current callback logic assumes there is no optimization running in parallel.
        # The state management may not work when multiple optimizations are running in parallel.
        # optimizer_stack_level is used to determine if the callback is called within compile
        # we cannot use boolean flag because the callback can be nested
        self.optimizer_stack_level = 0
        # call_id: (key, step)
        self._call_id_to_metric_key: dict[str, tuple[str, int]] = {}
        self._call_id_to_run_id: dict[str, str] = {}
        self._evaluation_counter = defaultdict(int)

    def set_dependencies_schema(self, dependencies_schema: dict[str, Any]):
        if self._dependencies_schema:
            raise MlflowException(
                "Dependencies schema should be set only once to the callback.",
                error_code=MlflowException.INVALID_PARAMETER_VALUE,
            )
        self._dependencies_schema = dependencies_schema

    @skip_if_trace_disabled
    def on_module_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        span_type = self._get_span_type_for_module(instance)
        attributes = self._get_span_attribute_for_module(instance)

        # The __call__ method of dspy.Module has a signature of (self, *args, **kwargs),
        # while all built-in modules only accepts keyword arguments. To avoid recording
        # empty "args" key in the inputs, we remove it if it's empty.
        if "args" in inputs and not inputs["args"]:
            inputs.pop("args")

        self._start_span(
            call_id,
            name=f"{instance.__class__.__name__}.forward",
            span_type=span_type,
            inputs=self._unpack_kwargs(inputs),
            attributes=attributes,
        )

    @skip_if_trace_disabled
    def on_module_end(
        self, call_id: str, outputs: Optional[Any], exception: Optional[Exception] = None
    ):
        # NB: DSPy's Prediction object is a customized dictionary-like object, but its repr
        # is not easy to read on UI. Therefore, we unpack it to a dictionary.
        # https://github.com/stanfordnlp/dspy/blob/6fe693528323c9c10c82d90cb26711a985e18b29/dspy/primitives/prediction.py#L21-L28
        if isinstance(outputs, dspy.Prediction):
            outputs = outputs.toDict()

        self._end_span(call_id, outputs, exception)

    @skip_if_trace_disabled
    def on_lm_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        span_type = (
            SpanType.CHAT_MODEL if getattr(instance, "model_type", None) == "chat" else SpanType.LLM
        )

        attributes = {
            **instance.kwargs,
            "model": instance.model,
            "model_type": instance.model_type,
            "cache": instance.cache,
        }

        inputs = self._unpack_kwargs(inputs)

        span = self._start_span(
            call_id,
            name=f"{instance.__class__.__name__}.__call__",
            span_type=span_type,
            inputs=inputs,
            attributes=attributes,
        )

        if messages := self._extract_messages_from_lm_inputs(inputs):
            try:
                set_span_chat_messages(span, messages)
            except Exception as e:
                _logger.debug(f"Failed to set input messages for {span}. Error: {e}")

    @skip_if_trace_disabled
    def on_lm_end(
        self, call_id: str, outputs: Optional[Any], exception: Optional[Exception] = None
    ):
        st = self._call_id_to_span.get(call_id)
        try:
            output_msg = self._extract_messages_from_lm_outputs(outputs)
            set_span_chat_messages(st.span, output_msg, append=True)
        except Exception as e:
            _logger.debug(f"Failed to set output messages for {call_id}. Error: {e}")

        self._end_span(call_id, outputs, exception)

    def _extract_messages_from_lm_inputs(self, inputs: dict[str, Any]) -> list[dict[str, str]]:
        # LM input is either a list of messages or a prompt string
        # https://github.com/stanfordnlp/dspy/blob/ac5bf56bb1ed7261d9637168563328c1dfeb27af/dspy/clients/lm.py#L92
        # TODO: Extract tool definition once https://github.com/stanfordnlp/dspy/pull/2023 is merged
        return inputs.get("messages") or [{"role": "user", "content": inputs.get("prompt")}]

    def _extract_messages_from_lm_outputs(
        self, outputs: list[Union[str, dict[str, Any]]]
    ) -> list[dict[str, str]]:
        # LM output is either a string or a dictionary of text and logprobs
        # https://github.com/stanfordnlp/dspy/blob/ac5bf56bb1ed7261d9637168563328c1dfeb27af/dspy/clients/lm.py#L105-L114
        # TODO: Extract tool calls once https://github.com/stanfordnlp/dspy/pull/2023 is merged
        return [
            {"role": "assistant", "content": o.get("text") if isinstance(o, dict) else o}
            for o in outputs
        ]

    @skip_if_trace_disabled
    def on_adapter_format_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        self._start_span(
            call_id,
            name=f"{instance.__class__.__name__}.format",
            span_type=SpanType.PARSER,
            inputs=self._unpack_kwargs(inputs),
            attributes={},
        )

    @skip_if_trace_disabled
    def on_adapter_format_end(
        self, call_id: str, outputs: Optional[Any], exception: Optional[Exception] = None
    ):
        self._end_span(call_id, outputs, exception)

    @skip_if_trace_disabled
    def on_adapter_parse_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        self._start_span(
            call_id,
            name=f"{instance.__class__.__name__}.parse",
            span_type=SpanType.PARSER,
            inputs=self._unpack_kwargs(inputs),
            attributes={},
        )

    @skip_if_trace_disabled
    def on_adapter_parse_end(
        self, call_id: str, outputs: Optional[Any], exception: Optional[Exception] = None
    ):
        self._end_span(call_id, outputs, exception)

    @skip_if_trace_disabled
    def on_tool_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        # DSPy uses the special "finish" tool to signal the end of the agent.
        if instance.name == "finish":
            return

        inputs = self._unpack_kwargs(inputs)
        # Tools are always called with keyword arguments only.
        inputs.pop("args", None)

        self._start_span(
            call_id,
            name=f"Tool.{instance.name}",
            span_type=SpanType.TOOL,
            inputs=inputs,
            attributes={
                "name": instance.name,
                "description": instance.desc,
                "args": instance.args,
            },
        )

    @skip_if_trace_disabled
    def on_tool_end(
        self, call_id: str, outputs: Optional[Any], exception: Optional[Exception] = None
    ):
        if call_id in self._call_id_to_span:
            self._end_span(call_id, outputs, exception)

    def on_evaluate_start(self, call_id: str, instance: Any, inputs: dict[str, Any]):
        """
        Callback handler at the beginning of evaluation call. Available with DSPy>=2.6.9.
        This callback starts a nested run for each evaluation call inside optimization.
        If called outside optimization and no active run exists, it creates a new run.
        """
        if not get_autologging_config(FLAVOR_NAME, "log_evals"):
            return

        if self.optimizer_stack_level > 0:
            key = "eval"
            if callback_metadata := inputs.get("callback_metadata"):
                if "metric_key" in callback_metadata:
                    key = callback_metadata["metric_key"]
            with _lock:
                # we may want to include optimizer_stack_level in the key
                # to handle nested optimization
                step = self._evaluation_counter[key]
                self._evaluation_counter[key] += 1
            run = mlflow.start_run(run_name=f"{key}_{step}", nested=True)
            self._call_id_to_metric_key[call_id] = (key, step)
            self._call_id_to_run_id[call_id] = run.info.run_id
        else:
            if mlflow.active_run() is None:
                run = mlflow.start_run()
                self._call_id_to_run_id[call_id] = run.info.run_id
        if program := inputs.get("program"):
            save_dspy_module_state(program, "model.json")
            log_dspy_module_params(program)

    def on_evaluate_end(
        self,
        call_id: str,
        outputs: Any,
        exception: Optional[Exception] = None,
    ):
        """
        Callback handler at the end of evaluation call. Available with DSPy>=2.6.9.
        This callback logs the evaluation score to the individual run
        and add eval metric to the parent run if called inside optimization.
        """
        if not get_autologging_config(FLAVOR_NAME, "log_evals"):
            return
        if exception:
            mlflow.end_run(status=RunStatus.to_string(RunStatus.FAILED))
            return
        score = None
        if isinstance(outputs, float):
            score = outputs
        elif isinstance(outputs, tuple):
            score = outputs[0]
        elif isinstance(outputs, dspy.Prediction):
            score = float(outputs)
            try:
                mlflow.log_table(self._generate_result_table(outputs.results), "result_table.json")
            except Exception:
                _logger.debug("Failed to log result table.", exc_info=True)
        if score is not None:
            mlflow.log_metric("eval", score)

        if self._call_id_to_run_id.pop(call_id, None):
            mlflow.end_run()
        if self.optimizer_stack_level > 0 and mlflow.active_run() is not None:
            if call_id not in self._call_id_to_metric_key:
                return
            key, step = self._call_id_to_metric_key.pop(call_id)
            if score is not None:
                mlflow.log_metric(
                    key,
                    score,
                    step=step,
                )

    def reset(self):
        self._call_id_to_metric_key: dict[str, tuple[str, int]] = {}
        self._call_id_to_run_id: dict[str, str] = {}
        self._evaluation_counter = defaultdict(int)

    def _start_span(
        self,
        call_id: str,
        name: str,
        span_type: SpanType,
        inputs: dict[str, Any],
        attributes: dict[str, Any],
    ):
        prediction_context = get_prediction_context()
        if prediction_context and self._dependencies_schema:
            prediction_context.update(**self._dependencies_schema)

        # we shouldn't cache the model_id in the attributes, as it can change between calls
        if model_id := _MODEL_TRACKER.get_active_model_id():
            attributes = {**attributes, SpanAttributeKey.MODEL_ID: model_id}

        with maybe_set_prediction_context(prediction_context):
            span = start_client_span_or_trace(
                self._client,
                name=name,
                span_type=span_type,
                parent_span=mlflow.get_current_active_span(),
                inputs=inputs,
                attributes=attributes,
            )

        token = set_span_in_context(span)
        self._call_id_to_span[call_id] = SpanWithToken(span, token)

        return span

    def _end_span(
        self,
        call_id: str,
        outputs: Optional[Any],
        exception: Optional[Exception] = None,
    ):
        st = self._call_id_to_span.pop(call_id, None)

        if not st.span:
            _logger.warning(f"Failed to end a span. Span not found for call_id: {call_id}")
            return

        status = SpanStatusCode.OK if exception is None else SpanStatusCode.ERROR

        if exception:
            st.span.add_event(SpanEvent.from_exception(exception))

        try:
            end_client_span_or_trace(
                client=self._client,
                span=st.span,
                outputs=outputs,
                status=status,
            )
        finally:
            detach_span_from_context(st.token)

    def _get_span_type_for_module(self, instance):
        if isinstance(instance, dspy.Retrieve):
            return SpanType.RETRIEVER
        elif isinstance(instance, dspy.ReAct):
            return SpanType.AGENT
        elif isinstance(instance, dspy.Predict):
            return SpanType.LLM
        elif isinstance(instance, dspy.Adapter):
            return SpanType.PARSER
        else:
            return SpanType.CHAIN

    def _get_span_attribute_for_module(self, instance):
        if isinstance(instance, dspy.Predict):
            return {"signature": instance.signature.signature}
        elif isinstance(instance, dspy.ChainOfThought):
            if hasattr(instance, "signature"):
                signature = instance.signature.signature
            else:
                signature = instance.predict.signature.signature

            attributes = {"signature": signature}
            if hasattr(instance, "extended_signature"):
                attributes["extended_signature"] = instance.extended_signature.signature
            return attributes
        return {}

    def _unpack_kwargs(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Unpacks the kwargs from the inputs dictionary"""
        # NB: Not using pop() to avoid modifying the original inputs dictionary
        kwargs = inputs.get("kwargs", {})
        inputs_wo_kwargs = {k: v for k, v in inputs.items() if k != "kwargs"}
        return {**inputs_wo_kwargs, **kwargs}

    def _generate_result_table(
        self, outputs: list[tuple[dspy.Example, dspy.Prediction, Any]]
    ) -> dict[str, list[Any]]:
        result = {"score": []}
        for i, (example, prediction, score) in enumerate(outputs):
            for k, v in example.items():
                if f"example_{k}" not in result:
                    result[f"example_{k}"] = [None] * i
                result[f"example_{k}"].append(v)

            for k, v in prediction.items():
                if f"pred_{k}" not in result:
                    result[f"pred_{k}"] = [None] * i
                result[f"pred_{k}"].append(v)

            result["score"].append(score)

            for k, v in result.items():
                if len(v) != i + 1:
                    result[k].append(None)

        return result
