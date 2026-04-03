'use client';

import { useMemo } from 'react';
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
  /** Bubble boyutu (ZAxis) için tooltip etiketi */
  zLabel?: string;
  /** Tooltip’te dataKey yerine gösterilecek ek/override etiketler */
  tooltipFieldLabels?: Record<string, string>;
  /** Tooltip başlığı: `payload` içindeki alan (örn. `name` → fuar adı) */
  tooltipCategoryKey?: string;
  /** Sadece bu dataKey’ler tooltip satırında listelenir (Z/bubble alanı gizlemek için) */
  tooltipPayloadDataKeys?: string[];
  /** Y ekseni tick metni (örn. gelir → milyon formatı) */
  yTickFormatter?: (value: number) => string;
  /** X ekseni sağ alt köşe açıklaması (örn. balon boyutu ipucu) */
  xAxisCornerLabel?: string;
  height?: number;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

function paddedNumericDomain(values: number[]): [number, number] | undefined {
  const nums = values.filter((n) => Number.isFinite(n));
  if (nums.length === 0) return undefined;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min;
  const pad = span === 0 ? (Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1) : span * 0.1;
  return [min - pad, max + pad];
}

/** Balon (Z) ölçeği: en küçük veri → range alt sınırı, en büyük veri → üst sınır. 0’ı domain’e sokmuyoruz (yakın değerlerin aynı boyutta görünmesini engeller). */
function zBubbleDomain(values: number[]): [number, number] {
  const nums = values.filter((n) => Number.isFinite(n) && n >= 0);
  if (nums.length === 0) return [0, 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    const bump = min === 0 ? 1 : Math.max(min * 0.05, 1);
    return [Math.max(0, min - bump * 0.5), max + bump];
  }
  return [min, max];
}

export function ReportScatterChart({
  series,
  xKey,
  yKey,
  zKey,
  xLabel,
  yLabel,
  zLabel,
  tooltipFieldLabels,
  tooltipCategoryKey,
  tooltipPayloadDataKeys,
  yTickFormatter,
  xAxisCornerLabel,
  height = 300,
  showLegend = true,
  formatter,
}: ReportScatterChartProps) {
  const xDomain = useMemo(() => {
    const xs = series.flatMap((s) => s.data.map((d) => Number(d[xKey] ?? NaN)));
    return paddedNumericDomain(xs);
  }, [series, xKey]);

  const yDomain = useMemo(() => {
    const ys = series.flatMap((s) => s.data.map((d) => Number(d[yKey] ?? NaN)));
    return paddedNumericDomain(ys);
  }, [series, yKey]);

  const zDomain = useMemo(() => {
    if (!zKey) return undefined;
    const zs = series.flatMap((s) => s.data.map((d) => Number(d[zKey] ?? NaN)));
    return zBubbleDomain(zs);
  }, [series, zKey]);

  const tooltipDataKeyLabels = useMemo(
    () => ({
      [xKey]: xLabel ?? xKey,
      [yKey]: yLabel ?? yKey,
      ...(zKey ? { [zKey]: zLabel ?? zKey } : {}),
      ...tooltipFieldLabels,
    }),
    [xKey, yKey, zKey, xLabel, yLabel, zLabel, tooltipFieldLabels],
  );

  const chartMargin = useMemo(() => {
    const m = { ...CHART_MARGIN };
    if (xAxisCornerLabel) m.bottom = Math.max(m.bottom, 26);
    return m;
  }, [xAxisCornerLabel]);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={chartMargin}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xLabel ?? xKey}
            tick={AXIS_STYLE}
            stroke="transparent"
            domain={xDomain ?? ['auto', 'auto']}
            label={
              xAxisCornerLabel
                ? {
                    value: xAxisCornerLabel,
                    position: 'insideBottomRight',
                    offset: 0,
                    style: {
                      fill: AXIS_STYLE.fill,
                      fontSize: 11,
                      fontWeight: 500,
                    },
                  }
                : undefined
            }
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yLabel ?? yKey}
            tick={AXIS_STYLE}
            stroke="transparent"
            domain={yDomain ?? ['auto', 'auto']}
            tickFormatter={yTickFormatter}
          />
          {zKey && zDomain && (
            <ZAxis
              type="number"
              dataKey={zKey}
              domain={zDomain}
              range={[32, 520]}
            />
          )}
          <Tooltip
            content={
              <ChartTooltip
                formatter={formatter}
                dataKeyLabels={tooltipDataKeyLabels}
                categoryLabelKey={tooltipCategoryKey}
                includePayloadDataKeys={tooltipPayloadDataKeys}
              />
            }
          />
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
