'use client';

import { useMemo } from 'react';

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

interface ReportHeatmapProps {
  data: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  height?: number;
  colorScale?: [string, string];
  formatter?: (value: number) => string;
}

function interpolateColor(start: string, end: string, factor: number): string {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b] as const;
  };
  const [r1, g1, b1] = hexToRgb(start);
  const [r2, g2, b2] = hexToRgb(end);
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `rgb(${r},${g},${b})`;
}

export function ReportHeatmap({
  data,
  rowLabels,
  colLabels,
  height,
  colorScale = ['#1e1b4b', '#8b5cf6'],
  formatter,
}: ReportHeatmapProps) {
  const { cellMap, maxValue } = useMemo(() => {
    const map = new Map<string, number>();
    let max = 0;
    for (const cell of data) {
      const key = `${cell.row}|${cell.col}`;
      map.set(key, cell.value);
      if (cell.value > max) max = cell.value;
    }
    return { cellMap: map, maxValue: max };
  }, [data]);

  const cellSize = 36;
  const labelWidth = 100;
  const computedHeight = height ?? Math.max(200, rowLabels.length * (cellSize + 2) + 40);

  return (
    <div className="overflow-x-auto" style={{ maxHeight: computedHeight }}>
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th style={{ width: labelWidth }} />
            {colLabels.map((col) => (
              <th
                key={col}
                className="px-1 text-center text-[10px] font-medium text-white/50"
                style={{ width: cellSize, minWidth: cellSize }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((row) => (
            <tr key={row}>
              <td className="truncate pr-2 text-right text-[11px] text-white/60" style={{ maxWidth: labelWidth }}>
                {row}
              </td>
              {colLabels.map((col) => {
                const val = cellMap.get(`${row}|${col}`) ?? 0;
                const factor = maxValue > 0 ? val / maxValue : 0;
                const bg = val > 0 ? interpolateColor(colorScale[0], colorScale[1], factor) : 'rgba(255,255,255,0.03)';
                return (
                  <td
                    key={col}
                    className="rounded text-center text-[10px] font-medium text-white/80"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: bg,
                    }}
                    title={`${row} × ${col}: ${formatter ? formatter(val) : val}`}
                  >
                    {val > 0 ? (formatter ? formatter(val) : val) : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
