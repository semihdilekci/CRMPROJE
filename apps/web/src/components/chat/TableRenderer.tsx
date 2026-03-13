'use client';

import type { TableData } from '@crm/shared';

interface TableRendererProps {
  table: TableData;
}

export function TableRenderer({ table }: TableRendererProps) {
  const { columns, rows } = table;

  return (
    <div className="w-full overflow-visible rounded-xl border border-white/20 backdrop-blur-2xl bg-white/10 p-4 shadow-sm">
      <table className="w-full min-w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b-2 border-white/20 backdrop-blur-xl bg-white/5">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold text-white"
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
              className={`border-b border-white/10 ${
                ri % 2 === 1 ? 'bg-white/5' : ''
              }`}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="break-words px-4 py-2.5 text-white/60"
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
