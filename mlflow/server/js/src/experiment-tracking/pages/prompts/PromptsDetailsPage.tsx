import {
  Breadcrumb,
  Button,
  Header,
  PageWrapper,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import invariant from 'invariant';
import { ScrollablePageWrapperStyles } from '../../../common/components/ScrollablePageWrapper';
import ErrorUtils from '../../../common/utils/ErrorUtils';
import { Link, useParams } from '../../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../../common/utils/withErrorBoundary';
import Routes from '../../routes';
import { PromptContentPreview } from './components/PromptContentPreview';
import { PromptDetailsMetadata } from './components/PromptDetailsMetadata';
import { usePromptDetailsQuery } from './hooks/usePromptDetailsQuery';
import { PromptVersionsTable } from './components/PromptVersionsTable';
import React, { useRef, useState } from 'react';
import { keys } from 'lodash';
import { ResizableBox } from 'react-resizable';

const PromptDetailsPage = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const { theme } = useDesignSystemTheme();

  invariant(promptId, 'Prompt ID should be defined');

  const { data } = usePromptDetailsQuery({ promptId });
  const [selectedVersions, updateSelectedVersions] = useState({});

  if (keys(selectedVersions).length === 0) {
    updateSelectedVersions({ '2': true });
  }

  return (
    <PageWrapper css={{ ...ScrollablePageWrapperStyles, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Spacer shrinks={false} />
      <Header
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to={Routes.promptsPageRoute}>Prompts</Link>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
        title={data?.name}
        buttons={
          <Button componentId="TODO" type="primary">
            Create prompt version
          </Button>
        }
      />
      <Spacer shrinks={false} />
      <Typography.Title level={4}>Details</Typography.Title>
      <PromptDetailsMetadata promptEntity={data} />
      <div css={{ flex: 1, display: 'flex' }}>
        <ResizablePane>
          <div css={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography.Title level={4}>Prompt versions</Typography.Title>
            <PromptVersionsTable
              isLoading={false}
              selectedVersions={selectedVersions}
              onUpdateSelectedVersions={updateSelectedVersions}
            />
          </div>
        </ResizablePane>
        <div css={{ flex: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography.Title level={4}>Prompt (latest)</Typography.Title>
          <div css={{ borderLeft: `1px solid ${theme.colors.border}`, flex: 1 }}>
            adsf
            <PromptContentPreview promptVersions={[]} />
          </div>
        </div>
      </div>
      <Spacer shrinks={false} />
    </PageWrapper>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.EXPERIMENTS, PromptDetailsPage, undefined);

const ResizablePane = ({ children, initialWidth, maxWidth }: any) => {
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(initialWidth);
  const { theme } = useDesignSystemTheme();
  const elementRef = useRef<Element>();
  return (
    <ResizableBox
      width={300}
      height={undefined}
      axis="x"
      resizeHandles={['w']}
      minConstraints={[100, 150]}
      maxConstraints={[500, 150]}
      onResizeStart={() => setDragging(true)}
      onResizeStop={() => setDragging(false)}
      handle={
        <div
          css={{
            // width: theme.spacing.xs,
            // right: -(theme.spacing.xs / 2),
            height: '100%',
            backgroundColor: 'yellow',
            width: 20,
            // position: 'absolute',
            top: 0,
            cursor: 'ew-resize',
            '&:hover': {
              backgroundColor: theme.colors.border,
              opacity: 0.5,
            },
          }}
        />
      }
      css={{
        position: 'relative',
        display: 'flex',
      }}
    >
      {React.cloneElement(children, { ref: elementRef })}
    </ResizableBox>
  );
};
