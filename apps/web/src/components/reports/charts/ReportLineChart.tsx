'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS, CHART_MARGIN, AXIS_STYLE, GRID_STYLE } from './chart-theme';

interface LineSeries {
  dataKey: string;
  name: string;
  color?: string;
  dashed?: boolean;
}

interface ReportLineChartProps {
  data: Record<string, unknown>[];
  lines: LineSeries[];
  xKey?: string;
  height?: number;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export function ReportLineChart({
  data,
  lines,
  xKey = 'name',
  height = 300,
  showLegend = true,
  formatter,
}: ReportLineChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="transparent" />
          <YAxis tick={AXIS_STYLE} stroke="transparent" />
          <Tooltip content={<ChartTooltip formatter={formatter} categoryLabelKey={xKey} />} />
          {showLegend && lines.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              iconSize={10}
              iconType="line"
            />
          )}
          {lines.map((line, i) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length]}
              strokeWidth={2}
              strokeDasharray={line.dashed ? '5 5' : undefined}
              dot={{ r: 3, fill: line.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
