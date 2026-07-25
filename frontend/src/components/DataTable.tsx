import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  type SortingState,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnFiltersState,
  type ColumnDef,
  getSortedRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";
import Pagination from "./Pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  skeletonRowCount?: number;
  pagination?: boolean;
  filtering?: boolean;
  title?: string;
  button?: React.ReactNode;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  resetPageNumber?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  skeletonRowCount = 8,
  pagination = false,
  onNextPage,
  onPreviousPage,
  totalPages = 1,
  currentPage = 1,
  pageSize = 10,
  setPageSize,
  resetPageNumber,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    pageCount: totalPages,
  });
  return (
    <>
      <div className="rounded-xl shadow">
        <Table className="w-full text-sm text-left">
          <TableHeader className=" rounded-xl border-b ">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-6  py-3 border-b border-b-muted"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: skeletonRowCount }).map((_, index) => (
                <TableRow key={index} className="border-b border-b-muted">
                  {columns?.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="w-full rounded-full h-8" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && table.getRowModel()?.rows?.length > 0
              ? table.getRowModel()?.rows.map((row) => (
                  <TableRow key={row.id} className="">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-4 h-60"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <Pagination
          table={table}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          totalPages={totalPages}
          currentPage={currentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          resetPageNumber={resetPageNumber}
        />
      )}{" "}
    </>
  );
}
