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
  pagination?: boolean;
  pageSize?: number;
  showPageSizeOptions?: boolean;
  responsive?: boolean;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortable = true,
  className,
  pagination = true,
  pageSize = 10,
  showPageSizeOptions = true,
  responsive = true
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: 'asc'
  });
  
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    pageSize
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

  const getNestedValue = (obj: any, key: string): any => {
    return key.split('.').reduce((value, k) => value?.[k], obj);
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

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (paginationState.currentPage - 1) * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, paginationState, pagination]);

  const totalPages = Math.ceil(sortedData.length / paginationState.pageSize);
  const startItem = (paginationState.currentPage - 1) * paginationState.pageSize + 1;
  const endItem = Math.min(startItem + paginationState.pageSize - 1, sortedData.length);

  const handlePageChange = (newPage: number) => {
    setPaginationState(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPaginationState({
      currentPage: 1,
      pageSize: newPageSize
    });
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

  const getResponsiveColumnClass = (column: DataTableColumn<T>) => {
    if (!responsive || !column.responsive) return '';
    
    const breakpoints = column.responsive;
    const classes = [];
    
    if (breakpoints.hideOnMobile) classes.push('hidden sm:table-cell');
    if (breakpoints.hideOnTablet) classes.push('hidden lg:table-cell');
    
    return classes.join(' ');
  };

  const getColumnStyle = (column: DataTableColumn<T>) => {
    if (responsive && column.responsiveWidth) {
      return { width: column.responsiveWidth };
    }
    return column.width ? { width: column.width } : undefined;
  };

  const renderMobileCard = (row: T, index: number) => {
    const highPriorityColumns = columns.filter(col => col.priority === 'high');
    const mediumPriorityColumns = columns.filter(col => col.priority === 'medium');
    
    return (
      <div key={index} className="border-b border-gray-200 p-4 bg-white hover:bg-gray-50">
        <div className="space-y-2">
          {highPriorityColumns.map((column) => (
            <div key={column.key as string} className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {column.label}
              </span>
              <span className="text-sm text-gray-900 text-right">
                {renderCell(row, column)}
              </span>
            </div>
          ))}
          {mediumPriorityColumns.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Show more details
              </summary>
              <div className="mt-2 space-y-1">
                {mediumPriorityColumns.map((column) => (
                  <div key={column.key as string} className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">
                      {column.label}
                    </span>
                    <span className="text-sm text-gray-900 text-right">
                      {renderCell(row, column)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <table className={cn(
            'w-full divide-y divide-gray-200',
            responsive ? 'table-auto' : 'table-fixed'
          )}>
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key as string}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                        column.sortable && sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                        getResponsiveColumnClass(column)
                      )}
                      onClick={() => handleSort(column.key as string)}
                      style={getColumnStyle(column)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{column.label}</span>
                        <SortIcon column={column} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
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
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key as string}
                          className={cn(
                            'px-4 py-4 text-sm text-gray-900',
                            getResponsiveColumnClass(column)
                          )}
                          style={getColumnStyle(column)}
                        >
                          <div 
                            className="break-words overflow-hidden text-ellipsis"
                            title={typeof renderCell(row, column) === 'string' ? renderCell(row, column) : ''}
                          >
                            {renderCell(row, column)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        <div className="sm:hidden">
          {paginatedData.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
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
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedData.map((row, index) => renderMobileCard(row, index))}
            </div>
          )}
        </div>
        
        {pagination && sortedData.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <div className="flex items-center text-sm text-gray-700">
                <span className="mr-2">Show</span>
                {showPageSizeOptions && (
                  <select
                    value={paginationState.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                )}
                <span className="ml-2">
                  Showing {startItem} to {endItem} of {sortedData.length} entries
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={paginationState.currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginationState.currentPage - 1)}
                  disabled={paginationState.currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (paginationState.currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (paginationState.currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = paginationState.currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === paginationState.currentPage ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginationState.currentPage + 1)}
                  disabled={paginationState.currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={paginationState.currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

DataTable.displayName = 'DataTable';