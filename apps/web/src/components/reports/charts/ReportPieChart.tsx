'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { CHART_COLORS } from './chart-theme';

interface ReportPieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  showLabel?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export function ReportPieChart({
  data,
  height = 300,
  innerRadius = 0,
  showLegend = true,
  showLabel = true,
  formatter,
}: ReportPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="75%"
            paddingAngle={2}
            label={
              showLabel
                ? ({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                : undefined
            }
            labelLine={showLabel ? { stroke: 'rgba(248,250,252,0.3)' } : false}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={
                  formatter ??
                  ((val) => {
                    const n = Number(val);
                    const pct = total > 0 ? ((n / total) * 100).toFixed(1) : '0';
                    return `${n.toLocaleString('tr-TR')} (%${pct})`;
                  })
                }
              />
            }
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              iconSize={10}
              iconType="circle"
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
