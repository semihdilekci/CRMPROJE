'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartData } from '@crm/shared';

const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: unknown; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {label != null && (
        <p className="mb-1 font-medium text-text">{String(label)}</p>
      )}
      {payload.map((entry, i) => {
        const val = entry.value;
        const display =
          typeof val === 'number' || typeof val === 'string'
            ? String(val)
            : JSON.stringify(val);
        const key = entry.dataKey ?? entry.name ?? i;
        return (
          <p key={i} className="text-muted">
            {String(key)}: {display}
          </p>
        );
      })}
    </div>
  );
}

interface ChartRendererProps {
  chart: ChartData;
}

export function ChartRenderer({ chart }: ChartRendererProps) {
  const { chartType, title, labels, data, description } = chart;

  const isSimpleData = Array.isArray(data);
  const chartData = isSimpleData
    ? (data as number[]).map((v, i) => ({ name: labels[i] ?? '', value: v }))
    : (() => {
        const obj = data as { [key: string]: number[] };
        const keys = Object.keys(obj);
        const len = keys.length ? (obj[keys[0]]?.length ?? 0) : 0;
        return Array.from({ length: len }, (_, i) => {
          const row: Record<string, string | number> = {
            name: labels[i] ?? '',
          };
          for (const k of keys) row[k] = obj[k]?.[i] ?? 0;
          return row;
        });
      })();

  const chartMargin = { top: 16, right: 24, left: 24, bottom: 40 };
  const axisStyle = { fontSize: 13, fill: 'currentColor' };
  const legendStyle = { fontSize: 13, wrapperStyle: { paddingTop: 12 } };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              stroke="currentColor"
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={axisStyle} stroke="currentColor" width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              stroke="currentColor"
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={axisStyle} stroke="currentColor" width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS[0] }}
            />
          </LineChart>
        );
      case 'pie':
      case 'donut':
        return (
          <PieChart margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 70 : 0}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((_: unknown, i: number) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData} margin={chartMargin}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              stroke="currentColor"
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={axisStyle} stroke="currentColor" width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS[0]}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        );
      case 'stackedBar':
      case 'composed': {
        const barKeys =
          chartData.length > 0
            ? Object.keys(chartData[0] ?? {}).filter((k) => k !== 'name')
            : [];
        return (
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              stroke="currentColor"
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={axisStyle} stroke="currentColor" width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={legendStyle.wrapperStyle}
              iconSize={14}
              iconType="square"
              layout="horizontal"
              verticalAlign="bottom"
            />
            {barKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                stackId="stack"
                radius={[4, 4, 0, 0]}
              />
            ))}
          </ComposedChart>
        );
      }
      default:
        return (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              stroke="currentColor"
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={axisStyle} stroke="currentColor" width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface p-4">
      <h4 className="mb-3 text-[15px] font-semibold text-text">{title}</h4>
      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {description && (
        <p className="mt-2 text-[12px] italic text-muted">{description}</p>
      )}
    </div>
  );
}
