'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFairPerformance } from '@/hooks/use-fair-reports';
import { useFairs } from '@/hooks/use-fairs';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportScatterChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { FairPerformanceFairFilter } from '@/components/reports/FairPerformanceFairFilter';
import type { FairPerformanceFairSelection } from '@/components/reports/FairPerformanceFairFilter';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { FairPerformanceResponse, KpiItem, ReportTableColumn } from '@crm/shared';

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

const fairScatterFormatter = (val: unknown, name: string) => {
  if (name === 'wonRevenue') return formatCurrency(val);
  return Number(val).toLocaleString('tr-TR');
};

/** Y ekseni: kazanılan gelir (TRY) → "2,45 M" (milyon, tr-TR) */
const formatWonRevenueAxisMillions = (v: number) => {
  if (!Number.isFinite(v)) return '';
  const m = v / 1_000_000;
  return `${m.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} M`;
};

function safePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function aggregateKpisFromTable(rows: FairPerformanceResponse['tableData']) {
  if (rows.length === 0) {
    return {
      totalFairs: 0,
      totalOpportunities: 0,
      totalWonRevenue: 0,
      avgConversionRate: 0,
    };
  }
  const totalOpportunities = rows.reduce((s, r) => s + r.opportunityCount, 0);
  const totalWonRevenue = rows.reduce((s, r) => s + r.wonRevenue, 0);
  const totalWon = rows.reduce((s, r) => s + r.won, 0);
  return {
    totalFairs: rows.length,
    totalOpportunities,
    totalWonRevenue,
    avgConversionRate: safePercent(totalWon, totalOpportunities),
  };
}

function filterByFairIds<T extends { fairId: string }>(rows: T[], ids: Set<string>): T[] {
  return rows.filter((r) => ids.has(r.fairId));
}

export function FairPerformanceDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [fairSelection, setFairSelection] = useState<FairPerformanceFairSelection>(null);

  const { data: fairsList, isLoading: fairsLoading } = useFairs();
  const { data, isLoading } = useFairPerformance(filterValues);

  const visibleFairIds = useMemo(() => {
    const list = fairsList ?? [];
    if (list.length === 0) return new Set<string>();
    if (fairSelection === null) return new Set(list.map((f) => f.id));
    return new Set(fairSelection);
  }, [fairsList, fairSelection]);

  const filteredTableData = useMemo(
    () => filterByFairIds(data?.tableData ?? [], visibleFairIds),
    [data?.tableData, visibleFairIds],
  );

  const displayKpis = useMemo(
    () => (data ? aggregateKpisFromTable(filteredTableData) : null),
    [data, filteredTableData],
  );

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = useCallback(() => {
    setFilterValues({});
    setFairSelection(null);
  }, []);

  const fairFilterExtraActive = fairSelection !== null;

  const kpis: KpiItem[] = displayKpis
    ? [
        { label: 'Toplam Fuar', value: displayKpis.totalFairs, format: 'number', color: 'violet', icon: '🏛' },
        { label: 'Toplam Fırsat', value: displayKpis.totalOpportunities, format: 'number', color: 'cyan', icon: '🔄' },
        { label: 'Kazanılan Gelir', value: displayKpis.totalWonRevenue, format: 'currency', color: 'green', icon: '💰' },
        { label: 'Ort. Dönüşüm', value: displayKpis.avgConversionRate, format: 'percent', color: 'amber', icon: '📈' },
      ]
    : [];

  const oppCountData = useMemo(
    () =>
      filterByFairIds(data?.fairOpportunityCounts ?? [], visibleFairIds).map((f) => ({
        name: f.fairName,
        Kazanılan: f.won,
        Kaybedilen: f.lost,
        Açık: f.open,
      })),
    [data?.fairOpportunityCounts, visibleFairIds],
  );

  const pipelineData = useMemo(
    () =>
      filterByFairIds(data?.fairPipelineValues ?? [], visibleFairIds).map((f) => ({
        name: f.fairName,
        Pipeline: f.pipelineValue,
        Gelir: f.wonRevenue,
      })),
    [data?.fairPipelineValues, visibleFairIds],
  );

  const conversionData = useMemo(
    () =>
      filterByFairIds(data?.fairConversionRates ?? [], visibleFairIds)
        .sort((a, b) => b.rate - a.rate)
        .map((f) => ({
          name: f.fairName,
          Oran: f.rate,
        })),
    [data?.fairConversionRates, visibleFairIds],
  );

  const scatterSeries = useMemo(
    () => [
      {
        name: 'Fuarlar',
        data: filterByFairIds(data?.scatterData ?? [], visibleFairIds).map((f) => ({
          name: f.fairName,
          opportunityCount: f.opportunityCount,
          wonRevenue: f.wonRevenue,
          totalOpportunities: f.totalOpportunities,
        })),
        color: CHART_COLORS.neutral,
      },
    ],
    [data?.scatterData, visibleFairIds],
  );

  return (
    <ReportDashboardLayout
      title="Fuar Genel Performans"
      subtitle="Tüm fuarların performans metrikleri ve karşılaştırmalı analizi"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      filterBar={
        <ReportFilterBar
          prepend={
            <FairPerformanceFairFilter
              fairs={fairsList}
              isLoading={fairsLoading}
              value={fairSelection}
              onChange={setFairSelection}
            />
          }
          filters={FILTERS}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
          hasExtraActiveFilters={fairFilterExtraActive}
        />
      }
      csvExportConfig={{
        rows: filteredTableData,
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
            layout="horizontal"
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
            xAxisCornerLabel="Toplam Fırsat"
            yTickFormatter={formatWonRevenueAxisMillions}
            tooltipCategoryKey="name"
            tooltipPayloadDataKeys={['opportunityCount', 'wonRevenue']}
            height={300}
            showLegend={false}
            formatter={fairScatterFormatter}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Fuar Detay Tablosu"
        badge={data ? `${filteredTableData.length} fuar` : undefined}
        delay={0.9}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={filteredTableData}
          defaultSortBy="wonRevenue"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
