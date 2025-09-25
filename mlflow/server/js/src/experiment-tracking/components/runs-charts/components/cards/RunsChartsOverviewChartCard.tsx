import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  RunsChartsRunData,
  RunsChartsLineChartXAxisType,
  removeOutliersFromMetricHistory,
  runsChartHoverlabel,
} from '../RunsCharts.common';
import { RunsMetricsLinePlot } from '../RunsMetricsLinePlot';
import { RunsChartsTooltipMode, useRunsChartsTooltip } from '../../hooks/useRunsChartsTooltip';
import {
  RunsChartsLineChartYAxisType,
  RunsChartsMetricsOverviewCardConfig,
  type RunsChartsCardConfig,
  type RunsChartsLineCardConfig,
} from '../../runs-charts.types';
import {
  type RunsChartCardReorderProps,
  RunsChartCardWrapper,
  RunsChartsChartsDragGroup,
  RunsChartCardVisibilityProps,
  RunsChartCardSizeProps,
  RunsChartCardLoadingPlaceholder,
} from './ChartCard.common';
import { SampledMetricsByRun, useSampledMetricHistory } from '../../hooks/useSampledMetricHistory';
import { compact, first, intersection, isEqual, isObject, isUndefined, keys, pick, set, uniq } from 'lodash';
import {
  shouldEnableRelativeTimeDateAxis,
  shouldEnableChartExpressions,
} from '../../../../../common/utils/FeatureUtils';
import { findAbsoluteTimestampRangeForRelativeRange } from '../../utils/findChartStepsByTimestamp';
import { Figure } from 'react-plotly.js';
import { ReduxState } from '../../../../../redux-types';
import { shallowEqual, useSelector } from 'react-redux';
import { useCompareRunChartSelectedRange } from '../../hooks/useCompareRunChartSelectedRange';
import { MetricEntity, MetricHistoryByName } from '@mlflow/mlflow/src/experiment-tracking/types';
import type { RunsGroupByConfig } from '../../../experiment-page/utils/experimentPage.group-row-utils';
import { useGroupedChartRunData } from '../../../runs-compare/hooks/useGroupedChartRunData';
import {
  ExperimentChartImageDownloadFileFormat,
  useChartImageDownloadHandler,
} from '../../hooks/useChartImageDownloadHandler';
import { downloadChartMetricHistoryCsv } from '../../../experiment-page/utils/experimentPage.common-utils';
import { RunsChartsNoDataFoundIndicator } from '../RunsChartsNoDataFoundIndicator';
import { RunsChartsGlobalLineChartConfig } from '../../../experiment-page/models/ExperimentPageUIState';
import { useLineChartGlobalConfig } from '../hooks/useLineChartGlobalConfig';
import { useSampledMetricHistoryGraphQLLazy } from '../../hooks/useSampledMetricHistoryGraphQL';
import { LazyPlot } from '../../../LazyPlot';
import { useResizeObserver } from '../../../../../shared/web-shared/hooks';
import { getStableColorForRun } from '../../../../utils/RunNameUtils';
import { Typography } from '@databricks/design-system';
import { ChartSearchContext } from '../../../run-page/ChartSearchContext';
import { mode } from 'd3-array';

const getV2ChartTitle = (cardConfig: RunsChartsLineCardConfig): string => {
  if (shouldEnableChartExpressions() && cardConfig.yAxisKey === RunsChartsLineChartYAxisType.EXPRESSION) {
    const expressions = cardConfig.yAxisExpressions?.map((exp) => exp.expression) || [];
    return expressions?.join(' vs ') || '';
  }
  if (!cardConfig.selectedMetricKeys || cardConfig.selectedMetricKeys.length === 0) {
    return cardConfig.metricKey;
  }

  return cardConfig.selectedMetricKeys.join(' vs ');
};

export interface RunsChartsLineChartCardProps
  extends RunsChartCardReorderProps,
    RunsChartCardSizeProps,
    RunsChartCardVisibilityProps {
  config: RunsChartsMetricsOverviewCardConfig;
  chartRunData: RunsChartsRunData[];

  groupBy: RunsGroupByConfig | null;

  onDelete: () => void;
  onEdit: () => void;

  fullScreen?: boolean;

  autoRefreshEnabled?: boolean;
  hideEmptyCharts?: boolean;

  setFullScreenChart?: (chart: { config: RunsChartsCardConfig; title: string; subtitle: ReactNode }) => void;
  onDownloadFullMetricHistoryCsv?: (runUuids: string[], metricKeys: string[]) => void;

  globalLineChartConfig?: RunsChartsGlobalLineChartConfig;
}

const SUPPORTED_DOWNLOAD_FORMATS: (ExperimentChartImageDownloadFileFormat | 'csv' | 'csv-full')[] = [
  'png',
  'svg',
  'csv',
  'csv-full',
];

function decimalStableSort(arr: any[]) {
  return arr.slice().sort((a, b) => {
    // extract the number after the last underscore
    const numA = parseInt(a.split('_').pop(), 10);
    const numB = parseInt(b.split('_').pop(), 10);
    return numA - numB;
  });
}

export const RunsChartsOverviewChartCard = ({
  config,
  chartRunData,
  onDelete,
  onEdit,
  onDownloadFullMetricHistoryCsv,
  groupBy,
  fullScreen,
  setFullScreenChart,
  autoRefreshEnabled,
  hideEmptyCharts,
  globalLineChartConfig,
  isInViewport: isInViewportProp,
  isInViewportDeferred: isInViewportDeferredProp,
  positionInSection,
  ...reorderProps
}: RunsChartsLineChartCardProps) => {
  const allMetrics = useMemo(() => {
    const metrics = new Set<string>();
    chartRunData.forEach((run) => {
      keys(run.metrics).forEach((metric) => metrics.add(metric));
    });
    const all = decimalStableSort(Array.from(metrics));
    return all.filter((m) => m.includes(config.mode));
  }, [chartRunData, config.mode]);

  const runUuid = useMemo(() => {
    const all = chartRunData.map((run) => run.uuid);
    return first(all);
  }, [chartRunData]);

  const doQuery = useSampledMetricHistoryGraphQLLazy();

  const [dataPre, setData] = useState<SampledMetricsByRun | null>(null);

  useEffect(() => {
    doQuery({
      runUuids: [runUuid ?? ''],
      metricKeys: allMetrics,
      maxResults: 320,
    }).then((result) => {
      if (!runUuid) return;
      setData(result[runUuid]);
    });
  }, [doQuery, runUuid]);

  const createTooltipTemplate = (runName: string) => `<b>${runName}</b><br>` + '%{x}<br>%{y:.2f}' + '<extra></extra>';

  const data = useMemo(() => {
    if (!dataPre) return null;
    return Object.fromEntries(Object.entries(dataPre).map(([k, v]) => [k.replace(/\//g, '_'), v]));
  }, [dataPre]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .slice(0, config.mode === 'cpu' ? 2 : 16)
      .map(([metricKey, metricData]) => {
        if (metricKey === 'runUuid') return null;
        if (!isObject(metricData)) {
          return undefined;
        }
        return {
          x: metricData.metricsHistory?.map((point) => point.timestamp),
          y: metricData.metricsHistory?.map((point) => point.value),
          hovertemplate: createTooltipTemplate(metricKey),
          hovertext: metricKey,
          hoverlabel: runsChartHoverlabel,
          type: 'scatter',
          mode: 'lines',
          name: metricKey,
          line: {
            width: 1,
          },
          marker: {
            color: getStableColorForRun(metricKey),
          },
        };
      })
      .filter((trace) => trace !== null);
  }, [data, config]);

  const divref = useRef<HTMLDivElement>(null);
  const size = useResizeObserver({ ref: divref });
  const { width, height } = size || { width: 0, height: 0 };

  const setSearchContext = useContext(ChartSearchContext);
  const setSearch = setSearchContext.setSearch ?? (() => {});

  return (
    <RunsChartCardWrapper
      onEdit={onEdit}
      onDelete={onDelete}
      title={config.mode === 'cpu' ? 'CPU usage per node' : 'GPU usage per node'}
      uuid={config.uuid}
      dragGroupKey={RunsChartsChartsDragGroup.GENERAL_AREA}
      supportedDownloadFormats={SUPPORTED_DOWNLOAD_FORMATS}
      // Disable fullscreen button if the chart is empty
      {...reorderProps}
    >
      <div css={{ display: 'flex', overflow: 'hidden', gap: 8 }}>
        <div ref={divref} css={{ overflow: 'hidden', width: '100%', height: '100%' }}>
          <LazyPlot
            data={chartData}
            layout={{
              title: undefined,
              xaxis: { type: 'date' },
              width,
              showlegend: false,
              height,
              margin: {
                t: 0,
                b: 48,
                r: 0,
                l: 48,
                pad: 0,
              },
            }}
            style={{ width: '100%', height: 400 }}
            config={{
              displaylogo: false,
              doubleClick: 'autosize',
              scrollZoom: false,
              modeBarButtonsToRemove: ['toImage'],
            }}
          />
        </div>
        <div css={{ flex: '0 0 auto', overflow: 'auto', paddingRight: 20 }}>
          {allMetrics.slice(0, config.mode === 'cpu' ? 2 : 16).map((metricKey, index) => (
            <div key={metricKey} css={{ display: 'flex', gap: 4, fontSize: 12, alignItems: 'center', marginBottom: 4 }}>
              <div
                css={{ backgroundColor: getStableColorForRun(`node_${index}`), width: 12, height: 12, flexShrink: 0 }}
              ></div>
              <Typography.Link
                componentId="TODO"
                onClick={() => {
                  setSearch(`chart:${metricKey}`);
                }}
              >
                {config.mode === 'cpu' ? (
                  <>node_{index % 8}</>
                ) : (
                  <>
                    node{Math.floor(index / 8)}_chip_{index % 8}
                  </>
                )}
              </Typography.Link>
            </div>
          ))}
        </div>
      </div>
      {/* <LazyPlot
        data={chartData}
        layout={{ title: undefined, xaxis: { type: 'date' } }}
        style={{ width: '100%', height: 400 }}
      /> */}
      {/* <div
        css={{
          position: 'absolute',
          inset: 0,
          fontSize: 24,
          backgroundColor: '#ffffffcc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {config.mode === 'cpu' ? 'CPU' : 'GPU'} metrics chart
      </div> */}
    </RunsChartCardWrapper>
  );
  // const { xAxisKey, selectedXAxisMetricKey, lineSmoothness } = useLineChartGlobalConfig(config, globalLineChartConfig);

  // const toggleFullScreenChart = useCallback(() => {
  //   setFullScreenChart?.({
  //     config,
  //     title: getV2ChartTitle(config),
  //     subtitle: null,
  //   });
  // }, [config, setFullScreenChart]);

  // const slicedRuns = useMemo(() => chartRunData.filter(({ hidden }) => !hidden).reverse(), [chartRunData]);

  // const isGrouped = useMemo(() => slicedRuns.some((r) => r.groupParentInfo), [slicedRuns]);

  // const isEmptyDataset = useMemo(() => {
  //   const metricKeys = config.selectedMetricKeys ?? [config.metricKey];
  //   const metricsInRuns = slicedRuns.flatMap(({ metrics }) => Object.keys(metrics));
  //   return intersection(metricKeys, uniq(metricsInRuns)).length === 0;
  // }, [config, slicedRuns]);

  // const runUuidsToFetch = useMemo(() => {
  //   if (isGrouped) {
  //     // First, get all runs inside visible groups
  //     const runsInGroups = compact(slicedRuns.map((r) => r.groupParentInfo)).flatMap((g) => g.runUuids);

  //     // Finally, get "remaining" runs that are not grouped
  //     const ungroupedRuns = compact(
  //       slicedRuns.filter((r) => !r.groupParentInfo && !r.belongsToGroup).map((r) => r.runInfo?.runUuid),
  //     );
  //     return [...runsInGroups, ...ungroupedRuns];
  //   }
  //   // If grouping is disabled, just get all run UUIDs from runInfo
  //   return compact(slicedRuns.map((r) => r.runInfo?.runUuid));
  // }, [slicedRuns, isGrouped]);

  // const metricKeys = useMemo(() => {
  //   const getYAxisKeys = (config: RunsChartsLineCardConfig) => {
  //     const fallback = [config.metricKey];
  //     if (!shouldEnableChartExpressions() || config.yAxisKey !== RunsChartsLineChartYAxisType.EXPRESSION) {
  //       return config.selectedMetricKeys ?? fallback;
  //     }
  //     const yAxisKeys = config.yAxisExpressions?.reduce((acc, exp) => {
  //       exp.variables.forEach((variable) => acc.add(variable));
  //       return acc;
  //     }, new Set<string>());
  //     return yAxisKeys === undefined ? fallback : Array.from(yAxisKeys);
  //   };
  //   const yAxisKeys = getYAxisKeys(config);
  //   const xAxisKeys = !selectedXAxisMetricKey ? [] : [selectedXAxisMetricKey];

  //   return yAxisKeys.concat(xAxisKeys);
  // }, [config, selectedXAxisMetricKey]);

  // const { setTooltip, resetTooltip, destroyTooltip, selectedRunUuid } = useRunsChartsTooltip(
  //   config,
  //   RunsChartsTooltipMode.MultipleTracesWithScanline,
  // );

  // // If the chart is in fullscreen mode, we always render its body.
  // // Otherwise, we only render the chart if it is in the viewport.
  // const isInViewport = fullScreen || isInViewportProp;
  // const isInViewportDeferred = fullScreen || isInViewportDeferredProp;

  // const { aggregateFunction } = groupBy || {};

  // const sampledMetricsByRunUuid = useSelector(
  //   (state: ReduxState) => pick(state.entities.sampledMetricsByRunUuid, runUuidsToFetch),
  //   shallowEqual,
  // );

  // /**
  //  * We set a local state for changes because full screen and non-full screen charts are
  //  * different components - this prevents having to sync them.
  //  */
  // const [yRangeLocal, setYRangeLocal] = useState<[number, number] | undefined>(() => {
  //   if (config.range && !isUndefined(config.range.yMin) && !isUndefined(config.range.yMax)) {
  //     return [config.range.yMin, config.range.yMax];
  //   }
  //   return undefined;
  // });

  // const { setOffsetTimestamp, stepRange, xRangeLocal, setXRangeLocal } = useCompareRunChartSelectedRange(
  //   config,
  //   xAxisKey,
  //   config.metricKey,
  //   sampledMetricsByRunUuid,
  //   runUuidsToFetch,
  //   xAxisKey === RunsChartsLineChartXAxisType.STEP ? config.xAxisScaleType : 'linear',
  // );

  // const { resultsByRunUuid, isLoading, isRefreshing } = useSampledMetricHistory({
  //   runUuids: runUuidsToFetch,
  //   metricKeys,
  //   enabled: isInViewportDeferred,
  //   maxResults: 320,
  //   range: stepRange,
  //   autoRefreshEnabled,
  // });

  // const chartLayoutUpdated = ({ layout }: Readonly<Figure>) => {
  //   // We only want to update the local state if the chart is not in full screen mode.
  //   // If not, this can cause synchronization issues between the full screen and non-full screen charts.
  //   if (!fullScreen) {
  //     let yAxisMin = yRangeLocal?.[0];
  //     let yAxisMax = yRangeLocal?.[1];
  //     let xAxisMin = xRangeLocal?.[0];
  //     let xAxisMax = xRangeLocal?.[1];

  //     const { autorange: yAxisAutorange, range: newYRange } = layout.yaxis || {};
  //     const yRangeChanged = !isEqual(yAxisAutorange ? [undefined, undefined] : newYRange, [yAxisMin, yAxisMax]);

  //     if (yRangeChanged) {
  //       // When user zoomed in/out or changed the Y range manually, hide the tooltip
  //       destroyTooltip();
  //     }

  //     if (yAxisAutorange) {
  //       yAxisMin = undefined;
  //       yAxisMax = undefined;
  //     } else if (newYRange) {
  //       yAxisMin = newYRange[0];
  //       yAxisMax = newYRange[1];
  //     }

  //     const { autorange: xAxisAutorange, range: newXRange } = layout.xaxis || {};
  //     if (xAxisAutorange) {
  //       // Remove saved range if chart is back to default viewport
  //       xAxisMin = undefined;
  //       xAxisMax = undefined;
  //     } else if (newXRange) {
  //       const ungroupedRunUuids = compact(slicedRuns.map(({ runInfo }) => runInfo?.runUuid));
  //       const groupedRunUuids = slicedRuns.flatMap(({ groupParentInfo }) => groupParentInfo?.runUuids ?? []);

  //       if (!shouldEnableRelativeTimeDateAxis() && xAxisKey === RunsChartsLineChartXAxisType.TIME_RELATIVE) {
  //         const timestampRange = findAbsoluteTimestampRangeForRelativeRange(
  //           resultsByRunUuid,
  //           [...ungroupedRunUuids, ...groupedRunUuids],
  //           newXRange as [number, number],
  //         );
  //         setOffsetTimestamp([...(timestampRange as [number, number])]);
  //       } else if (xAxisKey === RunsChartsLineChartXAxisType.TIME_RELATIVE_HOURS) {
  //         const timestampRange = findAbsoluteTimestampRangeForRelativeRange(
  //           resultsByRunUuid,
  //           [...ungroupedRunUuids, ...groupedRunUuids],
  //           newXRange as [number, number],
  //           1000 * 60 * 60, // Convert hours to milliseconds
  //         );
  //         setOffsetTimestamp([...(timestampRange as [number, number])]);
  //       } else {
  //         setOffsetTimestamp(undefined);
  //       }
  //       xAxisMin = newXRange[0];
  //       xAxisMax = newXRange[1];
  //     }

  //     if (
  //       !isEqual(
  //         { xMin: xRangeLocal?.[0], xMax: xRangeLocal?.[1], yMin: yRangeLocal?.[0], yMax: yRangeLocal?.[1] },
  //         { xMin: xAxisMin, xMax: xAxisMax, yMin: yAxisMin, yMax: yAxisMax },
  //       )
  //     ) {
  //       setXRangeLocal(isUndefined(xAxisMin) || isUndefined(xAxisMax) ? undefined : [xAxisMin, xAxisMax]);
  //       setYRangeLocal(isUndefined(yAxisMin) || isUndefined(yAxisMax) ? undefined : [yAxisMin, yAxisMax]);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   destroyTooltip();
  // }, [destroyTooltip, isLoading]);

  // const sampledData: RunsChartsRunData[] = useMemo(
  //   () =>
  //     slicedRuns.map((run) => {
  //       const metricsHistory = metricKeys.reduce((acc: MetricHistoryByName, key) => {
  //         const history = resultsByRunUuid[run.uuid]?.[key]?.metricsHistory;
  //         if (history) {
  //           acc[key] = config.ignoreOutliers ? removeOutliersFromMetricHistory(history) : history;
  //         }
  //         return acc;
  //       }, {});

  //       return {
  //         ...run,
  //         metricsHistory,
  //       };
  //     }),
  //   [metricKeys, resultsByRunUuid, slicedRuns, config.ignoreOutliers],
  // );

  // const sampledGroupData = useGroupedChartRunData({
  //   enabled: isGrouped,
  //   ungroupedRunsData: sampledData,
  //   metricKeys,
  //   sampledDataResultsByRunUuid: resultsByRunUuid,
  //   aggregateFunction,
  //   selectedXAxisMetricKey: xAxisKey === RunsChartsLineChartXAxisType.METRIC ? selectedXAxisMetricKey : undefined,
  //   ignoreOutliers: config.ignoreOutliers ?? false,
  // });

  // // Use grouped data traces only if enabled and if there are any groups
  // const chartData = isGrouped ? sampledGroupData : sampledData;

  // const [imageDownloadHandler, setImageDownloadHandler] = useChartImageDownloadHandler();

  // // If the component is not in the viewport, we don't want to render the chart
  // const renderChartBody = isInViewport;

  // // If the data is loading or chart has just entered the viewport, show a skeleton
  // const renderSkeleton = isLoading || !isInViewportDeferred;

  return (
    <RunsChartCardWrapper
      onEdit={onEdit}
      onDelete={onDelete}
      title="Overview"
      uuid={config.uuid}
      dragGroupKey={RunsChartsChartsDragGroup.GENERAL_AREA}
      supportedDownloadFormats={SUPPORTED_DOWNLOAD_FORMATS}
      // Disable fullscreen button if the chart is empty
      {...reorderProps}
    ></RunsChartCardWrapper>
  );
};

const styles = {
  lineChartCardWrapper: {
    overflow: 'hidden',
  },
};
