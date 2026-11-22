/**
 * @AUTHOR: Garima Mittal
 * @FILE: DataTable.jsx
 * @RESPONSIBILITY: Reusable, high-contrast SolIMS Grid Forest-Emerald & Soft-Mint enterprise table component with instant search, status pills, sorting, and empty states.
 * @DEPENDENCIES: react, lucide-react, erpClientConfig.js
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Inbox,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getStatusBadgeStyle } from '../erpClientConfig';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = '_id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  title = null,
  subtitle = null,
  icon: Icon = null,
  headerActions = null,
  emptyMessage = 'No records found',
  emptySubMessage = 'Try adjusting your search filters or add a new record.',
  emptyIcon: EmptyIcon = Inbox,
  onRowClick = null,
  selectedRowId = null,
  pageSize = 0, // 0 means show all
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter rows based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const lowerQuery = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = row[k];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(lowerQuery);
        });
      }

      // Default: inspect all top-level primitive values in row
      return Object.values(row).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sort rows based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    if (!pageSize || pageSize <= 0) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Table Header Bar */}
      {(title || searchable || headerActions) && (
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-2 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && (
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                    {title}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs tabular-nums">
                    {sortedData.length} records
                  </span>
                </div>
              )}
              {subtitle && <p className="text-[11px] text-slate-600 font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {searchable && (
              <div className="relative min-w-[200px] max-w-[300px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white text-xs pl-8 pr-7 py-2 rounded-full border border-slate-300 font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            {headerActions}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isSorted = sortConfig.key === col.key;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key || col.header}
                    onClick={() => isSortable && col.key && handleSort(col.key)}
                    className={`p-3.5 select-none font-bold text-slate-700 ${alignClass} ${
                      isSortable && col.key ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {isSortable && col.key && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#135D3B]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#135D3B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const rowKey = row[keyField] || rowIndex;
                const isSelected = selectedRowId !== null && row[keyField] === selectedRowId;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-emerald-50/40 border-l-4 border-[#135D3B]'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={col.key || col.header}
                          className={`p-3.5 ${alignClass} ${col.className || ''}`}
                        >
                          {col.render ? (
                            col.render(row, rowIndex)
                          ) : col.isStatusPill ? (
                            <StatusPill status={row[col.key]} />
                          ) : (
                            row[col.key] ?? '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center bg-white">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <EmptyIcon className="w-6 h-6" />
                    </div>
                    <div className="font-extrabold text-sm text-slate-800">{emptyMessage}</div>
                    <div className="text-xs text-slate-500 max-w-sm">{emptySubMessage}</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pageSize > 0 && sortedData.length > 0 && (
        <div className="p-3 bg-[#F4F9F6]/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * High-contrast Status Pill component for enterprise lists
 */
export const StatusPill = ({ status }) => {
  if (!status) return null;
  const style = getStatusBadgeStyle(status);

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
    >
      {status}
    </span>
  );
};

export default DataTable;
