import { QueryFunction, useQuery } from '@tanstack/react-query';
import { RegisteredPromptDetailsResponse } from '../types';
import { RegisteredPromptsApi } from '../api';

const queryFn: QueryFunction<RegisteredPromptDetailsResponse, PromptDetailsQueryKey> = ({ queryKey }) => {
  const [, { promptId }] = queryKey;
  return RegisteredPromptsApi.getPromptDetails(promptId);
};

type PromptDetailsQueryKey = ['prompts_list', { promptId: string }];

export const usePromptDetailsQuery = ({ promptId }: { promptId: string }) => {
  const queryResult = useQuery<
    RegisteredPromptDetailsResponse,
    Error,
    RegisteredPromptDetailsResponse,
    PromptDetailsQueryKey
  >(['prompts_list', { promptId }], {
    queryFn,
  });

  return {
    data: queryResult.data,
    error: queryResult.error ?? undefined,
    isLoading: queryResult.isLoading,
  };
};
