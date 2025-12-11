"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  actions?: {
    label: string;
    onClick: (row: T) => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  }[];
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  actions,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">No data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="font-semibold text-slate-900"
                >
                  {column.label}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="font-semibold text-slate-900">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <TableCell
                    key={`${row.id}-${String(column.key)}`}
                    className="py-3"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? "-")}
                  </TableCell>
                ))}
                {actions && actions.length > 0 && (
                  <TableCell className="py-3 space-x-2 flex">
                    {actions.map((action) => (
                      <Button
                        key={action.label}
                        onClick={() => action.onClick(row)}
                        variant={action.variant || "outline"}
                        size="sm"
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
