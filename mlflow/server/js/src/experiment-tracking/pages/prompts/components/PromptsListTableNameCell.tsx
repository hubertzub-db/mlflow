import { ColumnDef } from '@tanstack/react-table';
import { RegisteredPrompt } from '../types';
import { Button, PencilIcon, Tag, Typography } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import Routes from '../../../routes';
import { Link } from '../../../../common/utils/RoutingUtils';

export const PromptsListTableNameCell: ColumnDef<RegisteredPrompt>['cell'] = ({ row: { original }, getValue }) => {
  const name = getValue<string>();

  if (!original.prompt_id) {
    return name;
  }
  return <Link to={Routes.getPromptDetailsPageRoute(original.prompt_id)}>{name}</Link>;
};
