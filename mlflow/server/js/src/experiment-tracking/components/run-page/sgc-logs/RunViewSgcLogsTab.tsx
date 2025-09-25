import {
  Button,
  Card,
  ChevronDownIcon,
  ChevronUpIcon,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import type { KeyValueEntity } from '../../../../common/types';
import ArtifactPage from '../../ArtifactPage';
import { useMediaQuery } from '@databricks/web-shared/hooks';
import { UseGetRunQueryResponseOutputs } from '../hooks/useGetRunQuery';
import { ContentSection } from '@databricks/web-shared/utils';
import { useState } from 'react';
import { RunViewSgcLogsNodeSelector } from './RunViewSgcLogsNodeSelector';
import { RunsChartsCard } from '../../runs-charts/components/cards/RunsChartsCard';
import { SgcLogsNodes } from './sgc-logs.utils';

/**
 * A run page tab containing the artifact browser
 */
export const RunViewSgcLogsTab = ({
  runTags,
  runUuid,
}: {
  runUuid: string;
  runTags: Record<string, KeyValueEntity>;
}) => {
  const { theme } = useDesignSystemTheme();

  return (
    <div
      css={{
        overflow: 'hidden',
        flex: 1,
        paddingBottom: theme.spacing.md,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'flex-end' }}>
        <RunViewSgcLogsNodeSelector />
      </div>

      <ContentSection titleText="Logs" content={<div></div>} />
      <ContentSection
        titleText="Charts"
        content={
          <div css={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <XCom mode="gpu" />
            <XCom mode="cpu" />
          </div>
        }
      />
    </div>
  );
};

const props = {
  cardConfig: {
    uuid: 'overviewchart',
    type: 'OVERVIEW',
    runsCountToCompare: 10,
    metricSectionId: 'overview',
    deleted: false,
    isGenerated: true,
    mode: 'gpu',
  },
  chartRunData: [
    {
      displayName: 'dapper-perch-247',
      metrics: {
        'system/node_11/gpu': {
          key: 'system/node_11/gpu',
          value: 86,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_11/cpu': {
          key: 'system/node_11/cpu',
          value: 77,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_10/gpu': {
          key: 'system/node_10/gpu',
          value: 82,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_10/cpu': {
          key: 'system/node_10/cpu',
          value: 79,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_8/gpu': {
          key: 'system/node_8/gpu',
          value: 89,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_8/cpu': {
          key: 'system/node_8/cpu',
          value: 88,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_6/gpu': {
          key: 'system/node_6/gpu',
          value: 90,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_6/cpu': {
          key: 'system/node_6/cpu',
          value: 83,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_1/gpu': {
          key: 'system/node_1/gpu',
          value: 82,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_1/cpu': {
          key: 'system/node_1/cpu',
          value: 76,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_0/gpu': {
          key: 'system/node_0/gpu',
          value: 83,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_0/cpu': {
          key: 'system/node_0/cpu',
          value: 75,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_7/gpu': {
          key: 'system/node_7/gpu',
          value: 72,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_7/cpu': {
          key: 'system/node_7/cpu',
          value: 88,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_9/gpu': {
          key: 'system/node_9/gpu',
          value: 88,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_9/cpu': {
          key: 'system/node_9/cpu',
          value: 78,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_15/gpu': {
          key: 'system/node_15/gpu',
          value: 70,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_15/cpu': {
          key: 'system/node_15/cpu',
          value: 84,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_12/gpu': {
          key: 'system/node_12/gpu',
          value: 87,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_12/cpu': {
          key: 'system/node_12/cpu',
          value: 79,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_13/gpu': {
          key: 'system/node_13/gpu',
          value: 85,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_13/cpu': {
          key: 'system/node_13/cpu',
          value: 77,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_14/gpu': {
          key: 'system/node_14/gpu',
          value: 85,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_14/cpu': {
          key: 'system/node_14/cpu',
          value: 86,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_2/gpu': {
          key: 'system/node_2/gpu',
          value: 84,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_2/cpu': {
          key: 'system/node_2/cpu',
          value: 88,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_5/gpu': {
          key: 'system/node_5/gpu',
          value: 86,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_5/cpu': {
          key: 'system/node_5/cpu',
          value: 78,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_4/gpu': {
          key: 'system/node_4/gpu',
          value: 74,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_4/cpu': {
          key: 'system/node_4/cpu',
          value: 78,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_3/gpu': {
          key: 'system/node_3/gpu',
          value: 84,
          timestamp: 1757429974629,
          step: 499,
        },
        'system/node_3/cpu': {
          key: 'system/node_3/cpu',
          value: 81,
          timestamp: 1757429974629,
          step: 499,
        },
      },
      params: {},
      tags: {
        'mlflow.user': {
          key: 'mlflow.user',
          value: 'hubert.zub',
        },
        'mlflow.source.git.commit': {
          key: 'mlflow.source.git.commit',
          value: 'b2772845ef5d33cc91298390bbf406abbfd48a41',
        },
        'mlflow.runName': {
          key: 'mlflow.runName',
          value: 'dapper-perch-247',
        },
        'mlflow.source.name': {
          key: 'mlflow.source.name',
          value: 'raymet.py',
        },
        'mlflow.source.type': {
          key: 'mlflow.source.type',
          value: 'LOCAL',
        },
      },
      images: {},
      metricHistory: {},
      uuid: 'e34c9e9f41174523b5278f5778fab11d',
      color: '#2272B4',
      runInfo: {
        run_uuid: 'e34c9e9f41174523b5278f5778fab11d',
        experiment_id: '509546852401102387',
        run_name: 'dapper-perch-247',
        user_id: 'hubert.zub',
        status: 'FINISHED',
        start_time: 1757431009093,
        end_time: 1757431019531,
        artifact_uri:
          'file:///Users/hubert.zub/myexp/mlruns/509546852401102387/e34c9e9f41174523b5278f5778fab11d/artifacts',
        lifecycle_stage: 'active',
        run_id: 'e34c9e9f41174523b5278f5778fab11d',
        artifactUri:
          'file:///Users/hubert.zub/myexp/mlruns/509546852401102387/e34c9e9f41174523b5278f5778fab11d/artifacts',
        endTime: 1757431019531,
        experimentId: '509546852401102387',
        lifecycleStage: 'active',
        runUuid: 'e34c9e9f41174523b5278f5778fab11d',
        runName: 'dapper-perch-247',
        startTime: 1757431009093,
      },
    },
  ],
  index: 1,
  groupBy: null,
  canMoveDown: false,
  canMoveUp: true,
  previousChartUuid: 'overviewchart',
  autoRefreshEnabled: false,
  globalLineChartConfig: {
    xAxisKey: 'time',
    lineSmoothness: 0,
    selectedXAxisMetricKey: '',
  },
  height: 360,
  isInViewport: true,
  isInViewportDeferred: true,
};

const XCom = ({ mode }) => <RunsChartsCard {...(props as any)} cardConfig={{ ...props.cardConfig, mode }} />;
