'use client';

import { useMemo } from 'react';
import { useForecast } from '@/hooks/use-revenue-reports';
import { ReportDashboardLayout, KpiCard, ReportTable } from '@/components/reports';
import { ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { KpiItem, ReportTableColumn } from '@crm/shared';
import { CONVERSION_RATE_LABELS, getStageLabel, type ConversionRate } from '@crm/shared';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'stage', label: 'Aşama', sortable: true },
  { key: 'budget', label: 'Bütçe', sortable: true, align: 'right', format: 'currency' },
  { key: 'conversionRate', label: 'Dönüşüm', sortable: true },
  { key: 'stageWeight', label: 'Aşama Ağırlığı', sortable: true, align: 'right', format: 'percent' },
  { key: 'weightedValue', label: 'Ağırlıklı Değer', sortable: true, align: 'right', format: 'currency' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

function conversionLabel(rate: string): string {
  return CONVERSION_RATE_LABELS[rate as ConversionRate] ?? rate;
}

export function ForecastDashboard() {
  const { data, isLoading } = useForecast({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Ham Pipeline', value: data.kpis.rawPipelineValue, format: 'currency', color: 'cyan', icon: '📦' },
        { label: 'Ağırlıklı Pipeline', value: data.kpis.weightedPipelineValue, format: 'currency', color: 'violet', icon: '⚖️' },
        { label: 'Tahmini Kazanılacak', value: data.kpis.estimatedWinCount, format: 'number', color: 'green', icon: '🎯' },
      ]
    : [];

  const stageBarData = useMemo(
    () =>
      (data?.stageBreakdown ?? []).map((s) => ({
        name: s.label,
        Ham: s.rawValue,
        Ağırlıklı: s.weightedValue,
      })),
    [data],
  );

  const conversionBarData = useMemo(
    () =>
      (data?.conversionBreakdown ?? []).map((c) => ({
        name: c.label,
        Ham: c.rawValue,
        Ağırlıklı: c.weightedValue,
      })),
    [data],
  );

  const tableRows = useMemo(() => {
    const rows = data?.tableData ?? [];
    return rows.map((row) => ({
      ...row,
      stage: getStageLabel(row.stage),
      conversionRate: conversionLabel(row.conversionRate),
      stageWeight: typeof row.stageWeight === 'number' ? row.stageWeight * 100 : 0,
    }));
  }, [data]);

  return (
    <ReportDashboardLayout
      title="Bütçe Tahmini ve Pipeline Değerlemesi"
      subtitle="Açık fırsatların ham ve ağırlıklı pipeline görünümü — aşama ve dönüşüm kırılımı"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      csvExportConfig={{
        rows: tableRows,
        columns: TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'tahmin-pipeline',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Aşama Bazlı Tahmin" subtitle="Ham ve ağırlıklı değer" delay={0.5}>
          <ReportBarChart
            data={stageBarData}
            bars={[
              { dataKey: 'Ham', name: 'Ham', color: CHART_COLORS.neutral },
              { dataKey: 'Ağırlıklı', name: 'Ağırlıklı', color: CHART_COLORS.positive },
            ]}
            height={320}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
        <AnalyticsCard title="Dönüşüm Bazlı Tahmin" subtitle="Tahmin skoruna göre kırılım" delay={0.6}>
          <ReportBarChart
            data={conversionBarData}
            bars={[
              { dataKey: 'Ham', name: 'Ham', color: CHART_COLORS.neutral },
              { dataKey: 'Ağırlıklı', name: 'Ağırlıklı', color: CHART_COLORS.positive },
            ]}
            height={320}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Açık Fırsatlar — Pipeline Detayı"
        badge={data ? `${data.tableData.length} kayıt` : undefined}
        delay={0.75}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={tableRows}
          defaultSortBy="weightedValue"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
