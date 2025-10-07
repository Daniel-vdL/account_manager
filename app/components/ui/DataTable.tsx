import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import type { DataTableColumn } from '../../types';

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortable?: boolean;
  className?: string;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortable = true,
  className
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: 'asc'
  });

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    const newDirection = 
      sortState.key === columnKey && sortState.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    setSortState({
      key: columnKey,
      direction: newDirection
    });

    if (onSort) {
      onSort(columnKey, newDirection);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortState.key || onSort) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortState.key!);
      const bValue = getNestedValue(b, sortState.key!);

      let comparison = 0;
      
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return sortState.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortState, onSort]);

  const getNestedValue = (obj: any, key: string): any => {
    return key.split('.').reduce((value, k) => value?.[k], obj);
  };

  const renderCell = (row: T, column: DataTableColumn<T>) => {
    if (column.render) {
      const value = getNestedValue(row, column.key as string);
      return column.render(value, row);
    }
    
    return getNestedValue(row, column.key as string);
  };

  const SortIcon = ({ column }: { column: DataTableColumn<T> }) => {
    if (!column.sortable || !sortable) return null;

    const isActive = sortState.key === column.key;
    
    return (
      <span className="ml-2 inline-flex flex-col">
        <svg
          className={cn(
            'w-3 h-3 -mb-1',
            isActive && sortState.direction === 'asc' 
              ? 'text-blue-600' 
              : 'text-gray-400'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
        </svg>
        <svg
          className={cn(
            'w-3 h-3',
            isActive && sortState.direction === 'desc' 
              ? 'text-blue-600' 
              : 'text-gray-400'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </span>
    );
  };

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          <div className="animate-pulse">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex space-x-4">
                {columns.map((_, index) => (
                  <div key={index} className="h-4 bg-gray-300 rounded flex-1"></div>
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-4">
                  {columns.map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                      column.sortable && sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                      column.width && `w-[${column.width}]`
                    )}
                    onClick={() => handleSort(column.key as string)}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex items-center">
                      {column.label}
                      <SortIcon column={column} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {emptyMessage}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key as string}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        style={column.width ? { width: column.width } : undefined}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

DataTable.displayName = 'DataTable';