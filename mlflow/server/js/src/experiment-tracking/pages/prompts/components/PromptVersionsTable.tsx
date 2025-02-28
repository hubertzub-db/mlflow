import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { RegisteredPromptVersion } from '../types';
import { useMemo, useState } from 'react';
import { Table, TableCell, TableHeader, TableRow, TableRowSelectCell } from '@databricks/design-system';
import { keys } from 'lodash';

type PromptVersionsTableColumnDef = ColumnDef<RegisteredPromptVersion>;

export const PromptVersionsTable = ({
  promptVersions,
  isLoading,
  selectedVersions,
  onUpdateSelectedVersions,
}: {
  promptVersions?: RegisteredPromptVersion[];
  isLoading: boolean;
  selectedVersions: { [version: string]: boolean };
  onUpdateSelectedVersions: OnChangeFn<RowSelectionState>;
}) => {
  const columns = useMemo<PromptVersionsTableColumnDef[]>(
    () => [{ id: 'version', header: 'Version', accessorKey: 'version' }],
    [],
  );

  //   const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: promptVersions ?? [{ version: '2' }, { version: '1' }],
    getRowId: (row) => row.version,
    columns,
    state: {
      rowSelection: selectedVersions,
    },
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: onUpdateSelectedVersions,
  });

  return (
    <div css={{ flex: 1 }}>
      <Table scrollable someRowsSelected={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}>
        <TableRow isHeader>
          <TableRowSelectCell
            componentId="TODO"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />

          {table.getLeafHeaders().map((header) => (
            <TableHeader componentId="TODO" key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHeader>
          ))}
        </TableRow>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            <TableRowSelectCell
              componentId="TODO"
              isDisabled={row.getIsSelected() && keys(selectedVersions).length === 1}
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} css={{ alignItems: 'center' }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
