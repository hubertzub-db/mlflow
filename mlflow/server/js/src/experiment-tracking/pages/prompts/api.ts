import { fetchEndpoint } from '../../../common/utils/FetchUtils';
import { RegisteredPromptDetailsResponse } from './types';

const defaultErrorHandler = async ({ reject, response }: { reject: (cause: any) => void; response: Response }) => {
  const error = new Error('Request failed');
  if (response) {
    try {
      const messageFromReponse = (await response.json())?.message;
      error.message = messageFromReponse;
    } catch {
      // ignore
    }
  }

  reject(error);
};

export const RegisteredPromptsApi = {
  getPromptDetails: (promptId: string) => {
    return Promise.resolve<RegisteredPromptDetailsResponse>({
      prompt_id: promptId,
      name: `Prompt ${promptId}`,
      latestVersion: '1.0',
      createdBy: 'admin',
      createdAt: '2021-09-01',
      updatedAt: '2021-09-01',
      tags: [{ key: 'tag', value: 'value' }],
    });
    // return fetchEndpoint({
    //   relativeUrl: `ajax-api/2.0/prompts/${promptId}`,
    //   error: defaultErrorHandler
    // });
  },
  setRegisteredPromptTag: (promptId: string, key: string, value: string) => {
    return fetchEndpoint({
      relativeUrl: `ajax-api/2.0/prompts/${promptId}/tags`,
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
      error: defaultErrorHandler,
    });
  },
  deleteRegisteredPromptTag: (promptId: string, key: string) => {
    return fetchEndpoint({
      relativeUrl: `ajax-api/2.0/prompts/${promptId}/tags`,
      method: 'DELETE',
      body: JSON.stringify({ key }),
      error: defaultErrorHandler,
    });
  },
};
