import {
  CursorPagination,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { RegisteredPrompt } from '../types';
import { PromptsListTableTagsCell } from './PromptsListTableTagsCell';
import { PromptsListTableNameCell } from './PromptsListTableNameCell';

type PromptsTableColumnDef = ColumnDef<RegisteredPrompt>;

const usePromptsTableColumns = () => {
  const intl = useIntl();
  return useMemo(() => {
    const resultColumns: PromptsTableColumnDef[] = [
      {
        header: intl.formatMessage({ defaultMessage: 'Name', description: 'TODO' }),
        accessorKey: 'name',
        id: 'name',
        cell: PromptsListTableNameCell,
      },
      {
        header: intl.formatMessage({ defaultMessage: 'Latest version', description: 'TODO' }),
        cell: ({ row: { original } }) => <div>{original.latestVersion}</div>,
        id: 'latestVersion',
      },
      {
        header: intl.formatMessage({ defaultMessage: 'Created by', description: 'TODO' }),
        accessorKey: 'name',
        id: 'createdBy',
      },
      {
        header: intl.formatMessage({ defaultMessage: 'Last modified', description: 'TODO' }),
        accessorKey: 'lastModified',
        id: 'lastModified',
      },
      {
        header: intl.formatMessage({ defaultMessage: 'Tags', description: 'TODO' }),
        accessorKey: 'name',
        id: 'tags',
        cell: PromptsListTableTagsCell,
      },
    ];

    return resultColumns;
  }, [intl]);
};

export const PromptsListTable = ({
  prompts,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  onNextPage,
  onPreviousPage,
  onEditTags,
}: {
  prompts?: RegisteredPrompt[];
  error?: Error;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onEditTags: (editedEntity: RegisteredPrompt) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const columns = usePromptsTableColumns();

  const table = useReactTable({
    data: prompts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => row.prompt_id ?? index.toString(),
    meta: { onEditTags },
  });
  return (
    <Table
      scrollable
      pagination={
        <CursorPagination
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          componentId="TODO"
        />
      }
    >
      <TableRow isHeader>
        {table.getLeafHeaders().map((header) => (
          <TableHeader componentId="TODO" key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHeader>
        ))}
      </TableRow>
      {table.getRowModel().rows.map((row) => (
        <TableRow key={row.id} css={{ height: theme.general.buttonHeight }}>
          {row.getAllCells().map((cell) => (
            <TableCell key={cell.id} css={{ alignItems: 'center' }}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </Table>
  );
};
