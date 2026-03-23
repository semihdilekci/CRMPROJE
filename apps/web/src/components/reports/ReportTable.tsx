'use client';

import { useState, useMemo } from 'react';
import type { ReportTableColumn } from '@crm/shared';

interface ReportTableProps {
  columns: ReportTableColumn[];
  rows: Record<string, unknown>[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  maxRows?: number;
}

function formatCell(value: unknown, format?: string): string {
  if (value == null) return '—';
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('tr-TR') : String(value);
    case 'currency':
      if (typeof value === 'number') {
        if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`;
        return `₺${value.toLocaleString('tr-TR')}`;
      }
      return String(value);
    case 'percent':
      return typeof value === 'number' ? `%${value.toFixed(1)}` : String(value);
    case 'date':
      if (typeof value === 'string') {
        try {
          return new Date(value).toLocaleDateString('tr-TR');
        } catch {
          return value;
        }
      }
      return String(value);
    default:
      return String(value);
  }
}

export function ReportTable({
  columns,
  rows,
  defaultSortBy,
  defaultSortOrder = 'desc',
  maxRows,
}: ReportTableProps) {
  const [sortBy, setSortBy] = useState(defaultSortBy ?? '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  const sortedRows = useMemo(() => {
    if (!sortBy) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'tr');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortBy, sortOrder]);

  const displayRows = maxRows ? sortedRows.slice(0, maxRows) : sortedRows;

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 ${
                  col.sortable !== false ? 'cursor-pointer hover:text-white/70 select-none' : ''
                } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortBy === col.key && (
                    <span className="text-violet-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
              style={{
                opacity: 0,
                animation: `fadeUp 0.3s ease ${0.05 * Math.min(rowIdx, 10)}s forwards`,
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 text-xs text-white/70 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {formatCell(row[col.key], col.format)}
                </td>
              ))}
            </tr>
          ))}
          {displayRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-sm text-white/30"
              >
                Veri bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {maxRows && rows.length > maxRows && (
        <div className="mt-2 text-center text-[11px] text-white/30">
          {rows.length} kayıttan {maxRows} tanesi gösteriliyor
        </div>
      )}
    </div>
  );
}
