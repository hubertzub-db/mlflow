import { TableFilterInput, TableFilterLayout } from '@databricks/design-system';

export const PromptsListFilters = () => {
  return (
    <TableFilterLayout>
      <TableFilterInput placeholder="Search prompts" componentId="TODO" />
    </TableFilterLayout>
  );
};
