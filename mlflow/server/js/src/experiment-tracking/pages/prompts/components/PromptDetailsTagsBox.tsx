import { RegisteredPrompt } from '../types';
import { Button, PencilIcon, Tag, Typography } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUpdateModelVersionTracesTagsModal } from '../hooks/useUpdateRegisteredPromptTags';

export const PromptsListTableTagsBox = ({ promptEntity }: { promptEntity?: RegisteredPrompt }) => {
  const intl = useIntl();

  const { EditTagsModal, showEditTagsModal } = useUpdateModelVersionTracesTagsModal({});

  const visibleTagList = promptEntity?.tags || [];
  const containsTags = visibleTagList.length > 0;

  return (
    <div>
      {visibleTagList?.map((tag) => (
        <Tag componentId="TODO" key={tag.key}>
          <Typography.Text bold>{tag.key}:</Typography.Text> {tag.value}
        </Tag>
      ))}
      <Button
        componentId="TODO"
        size="small"
        icon={!containsTags ? undefined : <PencilIcon />}
        onClick={() => promptEntity && showEditTagsModal(promptEntity)}
        aria-label={intl.formatMessage({
          defaultMessage: 'Edit tags',
          description: 'TODO',
        })}
        children={!containsTags ? <FormattedMessage defaultMessage="Add tags" description="TODO" /> : undefined}
        type="tertiary"
      />
    </div>
  );
};
