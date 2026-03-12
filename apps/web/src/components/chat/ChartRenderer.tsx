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
  '#D4AF37',
  '#B8860B',
  '#8B7355',
  '#6B5B4F',
  '#4A4A4A',
  '#7C7C7C',
];

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
          const row: Record<string, string | number> = { name: labels[i] ?? '' };
          for (const k of keys) row[k] = obj[k]?.[i] ?? 0;
          return row;
        });
      })();

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_: unknown, i: number) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              fill="#D4AF37"
              fillOpacity={0.3}
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
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend />
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
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface p-4">
      <h4 className="mb-3 text-[14px] font-semibold text-text">{title}</h4>
      <div className="h-[240px] w-full">
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
