import { first } from 'lodash';
import { RegisteredPromptVersion } from '../types';

export const PromptContentPreview = ({ promptVersions }: { promptVersions: RegisteredPromptVersion[] }) => {
  const firstVersion = first(promptVersions);
  return <div>{firstVersion?.content}</div>;
};
