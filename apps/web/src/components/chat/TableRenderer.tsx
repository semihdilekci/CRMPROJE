'use client';

import type { TableData } from '@crm/shared';

interface TableRendererProps {
  table: TableData;
}

export function TableRenderer({ table }: TableRendererProps) {
  const { columns, rows } = table;

  return (
    <div className="max-h-[320px] w-full overflow-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[200px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-left font-semibold text-text"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-border/50 ${
                ri % 2 === 1 ? 'bg-surface/50' : ''
              }`}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="max-w-[200px] truncate px-3 py-2 text-muted"
                  title={String(cell)}
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
