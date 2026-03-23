'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS } from './chart-theme';

interface TreemapItem {
  name: string;
  value: number;
  children?: TreemapItem[];
}

interface ReportTreemapProps {
  data: TreemapItem[];
  height?: number;
  formatter?: (value: unknown, name: string) => string;
}

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  index?: number;
  depth?: number;
}

function CustomTreemapContent({ x = 0, y = 0, width = 0, height: h = 0, name, index = 0, depth = 0 }: CustomContentProps) {
  if (width < 30 || h < 20) return null;

  const colors = CHART_COLORS.primary;
  const bgColor = depth === 1
    ? colors[index % colors.length]
    : colors[(index + 3) % colors.length];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={h}
        rx={4}
        fill={bgColor}
        fillOpacity={depth === 1 ? 0.6 : 0.4}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
      />
      {width > 50 && h > 24 && (
        <text
          x={x + 6}
          y={y + 14}
          fill="white"
          fontSize={10}
          fontWeight={500}
          opacity={0.9}
        >
          {String(name ?? '').length > width / 7
            ? String(name ?? '').slice(0, Math.floor(width / 7)) + '…'
            : name}
        </text>
      )}
    </g>
  );
}

export function ReportTreemap({ data, height = 300, formatter }: ReportTreemapProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          nameKey="name"
          content={<CustomTreemapContent />}
        >
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
