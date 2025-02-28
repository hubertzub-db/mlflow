import { Button, Header, PageWrapper, Spacer } from '@databricks/design-system';
import { ScrollablePageWrapperStyles } from '../../../common/components/ScrollablePageWrapper';
import ErrorUtils from '../../../common/utils/ErrorUtils';
import { withErrorBoundary } from '../../../common/utils/withErrorBoundary';
import { PromptsListFilters } from './components/PromptsListFilters';
import { PromptsListTable } from './components/PromptsListTable';
import { usePromptsListQuery } from './hooks/usePromptsListQuery';
import { useUpdateModelVersionTracesTagsModal } from './hooks/useUpdateRegisteredPromptTags';

const Prompts = () => {
  const { data, error, hasNextPage, hasPreviousPage, isLoading, onNextPage, onPreviousPage } = usePromptsListQuery();

  const { EditTagsModal, showEditTagsModal } = useUpdateModelVersionTracesTagsModal({});

  return (
    <PageWrapper css={{ ...ScrollablePageWrapperStyles, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Spacer shrinks={false} />
      <Header
        title="Prompts"
        buttons={
          <Button componentId="" type="primary">
            Create prompt
          </Button>
        }
      />
      <Spacer shrinks={false} />
      <div css={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PromptsListFilters />
        <PromptsListTable
          prompts={data}
          error={error}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          isLoading={isLoading}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          onEditTags={showEditTagsModal}
        />
        {EditTagsModal}
      </div>
    </PageWrapper>
  );
};

const PromptsPage = withErrorBoundary(ErrorUtils.mlflowServices.EXPERIMENTS, Prompts, undefined);

export default PromptsPage;
