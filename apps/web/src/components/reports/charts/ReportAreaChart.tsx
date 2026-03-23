'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS, CHART_MARGIN, AXIS_STYLE, GRID_STYLE } from './chart-theme';

interface AreaSeries {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
}

interface ReportAreaChartProps {
  data: Record<string, unknown>[];
  areas: AreaSeries[];
  xKey?: string;
  height?: number;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

let gradientIdCounter = 0;

export function ReportAreaChart({
  data,
  areas,
  xKey = 'name',
  height = 300,
  showLegend = true,
  formatter,
}: ReportAreaChartProps) {
  const instanceId = ++gradientIdCounter;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            {areas.map((area, i) => {
              const color = area.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length];
              return (
                <linearGradient key={area.dataKey} id={`areaGrad-${instanceId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="transparent" />
          <YAxis tick={AXIS_STYLE} stroke="transparent" />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {showLegend && areas.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              iconSize={10}
              iconType="line"
            />
          )}
          {areas.map((area, i) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={area.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length]}
              fill={`url(#areaGrad-${instanceId}-${i})`}
              stackId={area.stackId}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
