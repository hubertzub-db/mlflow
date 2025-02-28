import { FormattedMessage } from 'react-intl';
import { DetailsOverviewMetadataRow } from '../../../components/DetailsOverviewMetadataRow';
import { DetailsOverviewMetadataTable } from '../../../components/DetailsOverviewMetadataTable';
import { RegisteredPrompt } from '../types';
import { PromptsListTableTagsBox } from './PromptDetailsTagsBox';

export const PromptDetailsMetadata = ({ promptEntity }: { promptEntity?: RegisteredPrompt }) => {
  return (
    <DetailsOverviewMetadataTable>
      <DetailsOverviewMetadataRow
        title={<FormattedMessage defaultMessage="Created at" description="TODO" />}
        value={promptEntity?.createdAt}
      />
      <DetailsOverviewMetadataRow
        title={<FormattedMessage defaultMessage="Updated at" description="TODO" />}
        value={promptEntity?.updatedAt}
      />
      <DetailsOverviewMetadataRow
        title={<FormattedMessage defaultMessage="Created by" description="TODO" />}
        value={promptEntity?.createdBy}
      />
      <DetailsOverviewMetadataRow
        title={<FormattedMessage defaultMessage="Tags" description="TODO" />}
        value={<PromptsListTableTagsBox promptEntity={promptEntity} />}
      />
    </DetailsOverviewMetadataTable>
  );
};
