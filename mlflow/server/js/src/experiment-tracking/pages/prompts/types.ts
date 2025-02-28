export interface RegisteredPrompt {
  prompt_id?: string;
  name?: string;
  latestVersion?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  tags?: { key: string; value: string }[];
}

export interface RegisteredPromptVersion {
  version: string;
  content?: string;
}

export interface RegisteredPromptsListResponse {
  prompts?: RegisteredPrompt[];
  next_page_token?: string;
}

export type RegisteredPromptDetailsResponse = RegisteredPrompt;
