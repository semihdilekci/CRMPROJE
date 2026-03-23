'use client';

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ResponsiveContainer, Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS, CHART_MARGIN, AXIS_STYLE, GRID_STYLE } from './chart-theme';

interface ScatterSeries {
  data: Array<Record<string, unknown>>;
  name: string;
  color?: string;
}

interface ReportScatterChartProps {
  series: ScatterSeries[];
  xKey: string;
  yKey: string;
  zKey?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export function ReportScatterChart({
  series,
  xKey,
  yKey,
  zKey,
  xLabel,
  yLabel,
  height = 300,
  showLegend = true,
  formatter,
}: ReportScatterChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={CHART_MARGIN}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xLabel ?? xKey}
            tick={AXIS_STYLE}
            stroke="transparent"
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yLabel ?? yKey}
            tick={AXIS_STYLE}
            stroke="transparent"
          />
          {zKey && <ZAxis dataKey={zKey} range={[40, 400]} />}
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {showLegend && series.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              iconSize={10}
              iconType="circle"
            />
          )}
          {series.map((s, i) => (
            <Scatter
              key={s.name}
              name={s.name}
              data={s.data}
              fill={s.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length]}
              fillOpacity={0.7}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
