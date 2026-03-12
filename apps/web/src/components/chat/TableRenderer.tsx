'use client';

import type { TableData } from '@crm/shared';

interface TableRendererProps {
  table: TableData;
}

export function TableRenderer({ table }: TableRendererProps) {
  const { columns, rows } = table;

  return (
    <div className="w-full overflow-visible rounded-xl border border-border bg-surface p-4 shadow-sm">
      <table className="w-full min-w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b-2 border-border bg-surface">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold text-text"
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
                  className="break-words px-4 py-2.5 text-muted"
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
