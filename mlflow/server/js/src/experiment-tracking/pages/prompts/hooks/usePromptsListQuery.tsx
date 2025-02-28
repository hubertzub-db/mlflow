import { QueryFunction, useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { RegisteredPromptsListResponse } from '../types';

const queryFn: QueryFunction<RegisteredPromptsListResponse, PromptsListQueryKey> = ({ queryKey }) => {
  const [, { pageToken }] = queryKey;
  const currentPage = pageToken ? Number(pageToken) : 1;
  return Promise.resolve({
    prompts: new Array(20.0).fill(0).map((_, i) => ({
      prompt_id: `${currentPage}-${i}`,
      name: `Prompt ${i} from page ${currentPage}`,
      latestVersion: '1.0',
      createdBy: 'admin',
      lastModified: '2021-09-01',
      tags: [{ key: 'tag', value: 'value' }],
    })),
    next_page_token: (currentPage + 1).toString(),
  });
};

type PromptsListQueryKey = ['prompts_list', { searchFilter?: string; pageToken?: string }];

export const usePromptsListQuery = ({
  searchFilter,
}: {
  searchFilter?: string;
} = {}) => {
  const previousPageTokens = useRef<(string | undefined)[]>([]);

  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined);

  const queryResult = useQuery<
    RegisteredPromptsListResponse,
    Error,
    RegisteredPromptsListResponse,
    PromptsListQueryKey
  >(['prompts_list', { searchFilter, pageToken: currentPageToken }], {
    queryFn,
  });

  const onNextPage = useCallback(() => {
    previousPageTokens.current.push(currentPageToken);
    setCurrentPageToken(queryResult.data?.next_page_token);
  }, [queryResult.data?.next_page_token, currentPageToken]);

  const onPreviousPage = useCallback(() => {
    const previousPageToken = previousPageTokens.current.pop();
    setCurrentPageToken(previousPageToken);
  }, []);

  return {
    data: queryResult.data?.prompts,
    error: queryResult.error ?? undefined,
    isLoading: queryResult.isLoading,
    hasNextPage: queryResult.data?.next_page_token !== undefined,
    hasPreviousPage: Boolean(currentPageToken),
    onNextPage,
    onPreviousPage,
  };
};
