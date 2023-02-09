import { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  extractCanonicalSortKey,
  isCanonicalSortKeyOfType,
  makeCanonicalSortKey,
} from '../../experiment-page/utils/experimentPage.column-utils';
import type { RunsCompareCardConfig, RunsCompareContourCardConfig } from '../runs-compare.types';
import {
  RunsCompareMetricParamSelect,
  RunsCompareConfigureField,
  RunsCompareRunNumberSelect,
} from './RunsCompareConfigure.common';

type ValidAxis = keyof Pick<RunsCompareContourCardConfig, 'xaxis' | 'yaxis' | 'zaxis'>;

/**
 * Form containing configuration controls for Contour runs compare chart.
 */
export const RunsCompareConfigureContourChart = ({
  state,
  onStateChange,
  metricKeyList,
  paramKeyList,
}: {
  metricKeyList: string[];
  paramKeyList: string[];
  state: RunsCompareContourCardConfig;
  onStateChange: (setter: (current: RunsCompareCardConfig) => RunsCompareContourCardConfig) => void;
}) => {
  const { formatMessage } = useIntl();

  /**
   * Callback for updating X or Y axis
   */
  const updateAxis = useCallback(
    (canonicalKey: string, axis: ValidAxis) => {
      const type = isCanonicalSortKeyOfType(canonicalKey, 'METRIC') ? 'METRIC' : 'PARAM';
      const key = extractCanonicalSortKey(canonicalKey, type);
      onStateChange((current) => ({
        ...(current as RunsCompareContourCardConfig),
        [axis]: { key, type },
      }));
    },
    [onStateChange],
  );

  /**
   * Callback for updating run count
   */
  const updateVisibleRunCount = useCallback(
    (runsCountToCompare: number) => {
      onStateChange((current) => ({
        ...(current as RunsCompareContourCardConfig),
        runsCountToCompare,
      }));
    },
    [onStateChange],
  );

  /**
   * If somehow axes are not predetermined, automatically
   * select the first metric/param so it's not empty
   */
  useEffect(() => {
    const firstMetric = metricKeyList?.[0];
    const firstParam = paramKeyList?.[0];
    if (!state.xaxis?.key) {
      if (firstMetric) {
        updateAxis(makeCanonicalSortKey('METRIC', firstMetric), 'xaxis');
      } else if (firstParam) {
        updateAxis(makeCanonicalSortKey('PARAM', firstParam), 'xaxis');
      }
    }
    if (!state.yaxis?.key) {
      if (firstMetric) {
        updateAxis(makeCanonicalSortKey('METRIC', firstMetric), 'yaxis');
      } else if (firstParam) {
        updateAxis(makeCanonicalSortKey('PARAM', firstParam), 'yaxis');
      }
    }
    if (!state.zaxis?.key) {
      if (firstMetric) {
        updateAxis(makeCanonicalSortKey('METRIC', firstMetric), 'zaxis');
      } else if (firstParam) {
        updateAxis(makeCanonicalSortKey('PARAM', firstParam), 'zaxis');
      }
    }
  }, [state.xaxis, state.yaxis, state.zaxis, updateAxis, metricKeyList, paramKeyList]);

  return (
    <>
      <RunsCompareConfigureField
        title={formatMessage({
          defaultMessage: 'X axis',
          description:
            'Label for X axis in Contour chart configurator in compare runs chart config modal',
        })}
      >
        <RunsCompareMetricParamSelect
          value={state.xaxis.key ? makeCanonicalSortKey(state.xaxis.type, state.xaxis.key) : ''}
          onChange={(value) => {
            updateAxis(value, 'xaxis');
          }}
          paramKeyList={paramKeyList}
          metricKeyList={metricKeyList}
        />
      </RunsCompareConfigureField>
      <RunsCompareConfigureField
        title={formatMessage({
          defaultMessage: 'Y axis',
          description:
            'Label for Y axis in Contour chart configurator in compare runs chart config modal',
        })}
      >
        <RunsCompareMetricParamSelect
          value={state.yaxis.key ? makeCanonicalSortKey(state.yaxis.type, state.yaxis.key) : ''}
          onChange={(value) => {
            updateAxis(value, 'yaxis');
          }}
          paramKeyList={paramKeyList}
          metricKeyList={metricKeyList}
        />
      </RunsCompareConfigureField>
      <RunsCompareConfigureField
        title={formatMessage({
          defaultMessage: 'Z axis',
          description:
            'Label for Z axis in Contour chart configurator in compare runs chart config modal',
        })}
      >
        <RunsCompareMetricParamSelect
          value={state.zaxis.key ? makeCanonicalSortKey(state.zaxis.type, state.zaxis.key) : ''}
          onChange={(value) => {
            updateAxis(value, 'zaxis');
          }}
          paramKeyList={paramKeyList}
          metricKeyList={metricKeyList}
        />
      </RunsCompareConfigureField>
      <RunsCompareRunNumberSelect
        value={state.runsCountToCompare}
        onChange={updateVisibleRunCount}
        options={[5, 10, 20]}
      />
    </>
  );
};
