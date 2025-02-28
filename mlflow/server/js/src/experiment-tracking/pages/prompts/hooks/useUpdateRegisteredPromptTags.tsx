import { get } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, Modal, Spacer } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { ModelTraceInfo } from '@databricks/web-shared/model-trace-explorer';
import { useMutation } from '@tanstack/react-query';
import { RegisteredPromptsApi } from '../api';
import { useEditKeyValueTagsModal } from '../../../../common/hooks/useEditKeyValueTagsModal';
import { RegisteredPrompt } from '../types';

// import { isModelVersionTraceInternalTag } from './utils';
// import { MlflowApiService } from '../../api';

// const defaultEmptyTag = { key: '', value: '' };

type UpdateTagsPayload = {
  promptId: string;
  toAdd: { key: string; value: string }[];
  toDelete: { key: string }[];
};

export const useUpdateModelVersionTracesTagsModal = ({ onSuccess }: { onSuccess?: () => void }) => {
  const updateMutation = useMutation<unknown, Error, UpdateTagsPayload>({
    mutationFn: async ({ toAdd, toDelete, promptId }) => {
      return Promise.all([
        ...toAdd.map(({ key, value }) => RegisteredPromptsApi.setRegisteredPromptTag(promptId, key, value)),
        ...toDelete.map(({ key }) => RegisteredPromptsApi.deleteRegisteredPromptTag(promptId, key)),
      ]);
    },
  });

  const { EditTagsModal, showEditTagsModal, isLoading } = useEditKeyValueTagsModal<RegisteredPrompt>({
    valueRequired: true,
    allAvailableTags: [],
    saveTagsHandler: (prompt, currentTags, newTags) => {
      // First, determine new tags to be added
      const addedOrModifiedTags = newTags.filter(
        ({ key: newTagKey, value: newTagValue }) =>
          !currentTags.some(
            ({ key: existingTagKey, value: existingTagValue }) =>
              existingTagKey === newTagKey && newTagValue === existingTagValue,
          ),
      );

      // Next, determine those to be deleted
      const deletedTags = currentTags.filter(
        ({ key: existingTagKey }) => !newTags.some(({ key: newTagKey }) => existingTagKey === newTagKey),
      );

      return new Promise<void>((resolve, reject) => {
        if (!prompt.prompt_id) {
          return reject();
        }
        // Send all requests to the mutation
        updateMutation.mutate(
          {
            promptId: prompt.prompt_id,
            toAdd: addedOrModifiedTags,
            toDelete: deletedTags,
          },
          {
            onSuccess: () => resolve(),
            onError: reject,
          },
        );
      });
    },
  });

  return { EditTagsModal, showEditTagsModal, isLoading };
};
