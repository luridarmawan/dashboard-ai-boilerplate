import {
  // createColumnHelper,
  flexRender,
  // getCoreRowModel,
  Table as TanStackTable,
  RowData,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

// Extend ColumnMeta to include noWrap property
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    noWrap?: boolean;
  }
}

interface UniversalTableProps<TData extends RowData> {
  table: TanStackTable<TData>;
  noWrap?: boolean;
  onRowClick?: (rowData: TData, columnInfo?: { id: string, name: string }) => void;
}

export const UniversalTable = <TData extends RowData>({ table, noWrap = true, onRowClick }: UniversalTableProps<TData>) => {
  return (
    <Table>
      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableCell
                isHeader
                key={header.id}
                className="px-5 py-3 font-bold text-gray-700 text-start text-theme-xs dark:text-gray-300"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <td
              colSpan={table.getAllColumns().length}
              className="px-5 py-8 text-center text-gray-500 dark:text-gray-400"
            >
              No data found.
            </td>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => {
            const handleRowClick = (columnInfo?: { id: string, name: string }) => {
              onRowClick?.(row.original, columnInfo);
            };

            return (
              <TableRow
                key={row.id}
                className={`hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => handleRowClick()}
              >
                {row.getVisibleCells().map((cell) => {
                  // Get noWrap setting from column meta, fallback to global noWrap prop
                  const columnNoWrap = cell.column.columnDef.meta?.noWrap ?? noWrap;
                  const cssNoWrap = columnNoWrap ? 'whitespace-nowrap' : '';

                  // Get column information
                  const id = cell.column.id;
                  const name = cell.column.columnDef.header?.toString() || id;

                  const handleCellClick = (e: React.MouseEvent) => {
                    e.stopPropagation(); // Prevent row click when clicking on cell
                    handleRowClick({ id, name });
                  };

                  return (
                    <TableCell
                      key={cell.id}
                      className={`px-5 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400 ${cssNoWrap} ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={onRowClick ? handleCellClick : undefined}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  )
}
