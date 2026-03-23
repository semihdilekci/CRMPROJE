'use client';

import { useState, useMemo } from 'react';
import { useFairPerformance } from '@/hooks/use-fair-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportScatterChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Fuar Durumu',
    type: 'select',
    options: [
      { value: 'active', label: 'Aktif' },
      { value: 'past', label: 'Geçmiş' },
    ],
    placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'startDate', label: 'Başlangıç', sortable: true, format: 'date' },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'won', label: 'Kazanılan', sortable: true, align: 'right', format: 'number' },
  { key: 'lost', label: 'Kaybedilen', sortable: true, align: 'right', format: 'number' },
  { key: 'open', label: 'Açık', sortable: true, align: 'right', format: 'number' },
  { key: 'pipelineValue', label: 'Pipeline', sortable: true, align: 'right', format: 'currency' },
  { key: 'wonRevenue', label: 'Gelir', sortable: true, align: 'right', format: 'currency' },
  { key: 'conversionRate', label: 'Dönüşüm', sortable: true, align: 'right', format: 'percent' },
  { key: 'totalTonnage', label: 'Tonaj', sortable: true, align: 'right', format: 'number' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function FairPerformanceDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useFairPerformance(filterValues);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Fuar', value: data.kpis.totalFairs, format: 'number', color: 'violet', icon: '🏛' },
        { label: 'Toplam Fırsat', value: data.kpis.totalOpportunities, format: 'number', color: 'cyan', icon: '🔄' },
        { label: 'Kazanılan Gelir', value: data.kpis.totalWonRevenue, format: 'currency', color: 'green', icon: '💰' },
        { label: 'Ort. Dönüşüm', value: data.kpis.avgConversionRate, format: 'percent', color: 'amber', icon: '📈' },
      ]
    : [];

  const oppCountData = useMemo(
    () =>
      (data?.fairOpportunityCounts ?? []).map((f) => ({
        name: f.fairName,
        Kazanılan: f.won,
        Kaybedilen: f.lost,
        Açık: f.open,
      })),
    [data],
  );

  const pipelineData = useMemo(
    () =>
      (data?.fairPipelineValues ?? []).map((f) => ({
        name: f.fairName,
        Pipeline: f.pipelineValue,
        Gelir: f.wonRevenue,
      })),
    [data],
  );

  const conversionData = useMemo(
    () =>
      (data?.fairConversionRates ?? []).map((f) => ({
        name: f.fairName,
        Oran: f.rate,
      })),
    [data],
  );

  const scatterSeries = useMemo(
    () => [
      {
        name: 'Fuarlar',
        data: (data?.scatterData ?? []).map((f) => ({
          name: f.fairName,
          opportunityCount: f.opportunityCount,
          wonRevenue: f.wonRevenue,
          totalOpportunities: f.totalOpportunities,
        })),
        color: CHART_COLORS.neutral,
      },
    ],
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Fuar Genel Performans"
      subtitle="Tüm fuarların performans metrikleri ve karşılaştırmalı analizi"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      filterBar={
        <ReportFilterBar
          filters={FILTERS}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      }
      csvExportConfig={{
        rows: data?.tableData ?? [],
        columns: TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'fuar-performans',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Fuar Bazlı Fırsat Sayısı" subtitle="Kazanılan / Kaybedilen / Açık" delay={0.5}>
          <ReportBarChart
            data={oppCountData}
            bars={[
              { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive },
              { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative },
              { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral },
            ]}
            height={300}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Fuar Bazlı Pipeline Değeri" subtitle="Pipeline + Kazanılan gelir" delay={0.6}>
          <ReportBarChart
            data={pipelineData}
            bars={[
              { dataKey: 'Pipeline', name: 'Pipeline', color: CHART_COLORS.neutral },
              { dataKey: 'Gelir', name: 'Kazanılan Gelir', color: CHART_COLORS.positive },
            ]}
            height={300}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Fuar Bazlı Dönüşüm Oranı" subtitle="Fuarlar dönüşüm oranına göre sıralı" delay={0.7}>
          <ReportBarChart
            data={conversionData}
            bars={[{ dataKey: 'Oran', name: 'Dönüşüm %', color: '#fbbf24' }]}
            layout="vertical"
            height={300}
            showLegend={false}
            formatter={(val) => `%${Number(val).toFixed(1)}`}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Fırsat Sayısı vs Kazanılan Gelir" subtitle="Nokta boyutu: toplam fırsat" delay={0.8}>
          <ReportScatterChart
            series={scatterSeries}
            xKey="opportunityCount"
            yKey="wonRevenue"
            zKey="totalOpportunities"
            xLabel="Fırsat Sayısı"
            yLabel="Kazanılan Gelir"
            height={300}
            showLegend={false}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Fuar Detay Tablosu"
        badge={data ? `${data.tableData.length} fuar` : undefined}
        delay={0.9}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="wonRevenue"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
