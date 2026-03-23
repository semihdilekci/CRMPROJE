'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS, CHART_MARGIN, AXIS_STYLE, GRID_STYLE } from './chart-theme';

interface BarSeries {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
}

interface ReportBarChartProps {
  data: Record<string, unknown>[];
  bars: BarSeries[];
  xKey?: string;
  layout?: 'vertical' | 'horizontal';
  height?: number;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export function ReportBarChart({
  data,
  bars,
  xKey = 'name',
  layout = 'horizontal',
  height = 300,
  showLegend = true,
  formatter,
}: ReportBarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ ...CHART_MARGIN, left: isVertical ? 80 : 8 }}
        >
          <CartesianGrid {...GRID_STYLE} />
          {isVertical ? (
            <>
              <XAxis type="number" tick={AXIS_STYLE} stroke="transparent" />
              <YAxis dataKey={xKey} type="category" tick={AXIS_STYLE} stroke="transparent" width={75} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="transparent" />
              <YAxis tick={AXIS_STYLE} stroke="transparent" />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              iconSize={10}
              iconType="square"
            />
          )}
          {bars.map((bar, i) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length]}
              stackId={bar.stackId}
              radius={bar.stackId ? undefined : [4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
