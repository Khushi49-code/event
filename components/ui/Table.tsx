// components/ui/Table.tsx
"use client";

import React, { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- Base Table Primitives ----------

export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full text-sm text-left border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableCaption({ children }: { children: ReactNode }) {
  return <caption className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-left">{children}</caption>;
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>;
}

export function TableRow({
  children,
  className = '',
  onClick,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-4 py-3 text-gray-800 dark:text-gray-200 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

// ---------- SortableTable ----------

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort: (key: string, direction: 'asc' | 'desc') => void;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
}: SortableTableProps<T>) {
  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable) return;
    const nextDirection: 'asc' | 'desc' =
      sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(col.key, nextDirection);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleHeaderClick(col)}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    {col.header}
                    {sortKey === col.key ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------- SelectableTable ----------

interface SelectableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectedItems: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  getRowId: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function SelectableTable<T extends Record<string, any>>({
  data,
  columns,
  selectedItems,
  onSelect,
  onSelectAll,
  getRowId,
  onRowClick,
}: SelectableTableProps<T>) {
  const allSelected = data.length > 0 && selectedItems.length === data.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const rowId = getRowId(item);
            const isSelected = selectedItems.includes(rowId);
            return (
              <TableRow
                key={rowId}
                className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                onClick={() => onRowClick?.(item)}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onSelect(rowId)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(item) : item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------- TablePagination ----------

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
}: TablePaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>
          Showing {start}-{end} of {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- TableSkeleton ----------

export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- ResponsiveTable ----------

export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className="border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[640px] px-4 sm:px-0">{children}</div>
    </div>
  );
}

// ---------- Compact Table Variant ----------

export function CompactTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="border rounded-lg overflow-auto">
      <table className={`w-full text-xs text-left border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export function CompactTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">{children}</thead>;
}

export function CompactTableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${className}`}>{children}</tr>;
}

export function CompactTableCell({
  children,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-2 py-1.5 text-gray-800 dark:text-gray-200 ${className}`} {...props}>
      {children}
    </td>
  );
}

export function CompactTableHeadCell({
  children,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-2 py-1.5 font-medium text-gray-600 dark:text-gray-300 text-[11px] uppercase tracking-wide ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}