'use client';

import { useMemo, useState } from 'react';
import { useRevenue } from '@/hooks/use-revenue-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import {
  ReportAreaChart,
  ReportBarChart,
  ReportLineChart,
  ReportPieChart,
  ReportTreemap,
} from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig, FilterOption } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';
import { CURRENCIES } from '@crm/shared';

const CURRENCY_OPTIONS: FilterOption[] = CURRENCIES.map((c) => ({ value: c, label: c }));

const FILTERS: FilterConfig[] = [
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
  {
    key: 'currency',
    label: 'Para Birimi',
    type: 'select',
    options: CURRENCY_OPTIONS,
    placeholder: 'Tümü',
  },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'budget', label: 'Bütçe', sortable: true, align: 'right', format: 'currency' },
  { key: 'currency', label: 'Para Birimi', align: 'center' },
  { key: 'closedAt', label: 'Kapanış', sortable: true, align: 'right', format: 'date' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function RevenueDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const revenueFilters = useMemo(
    () => ({
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
      currency: filterValues.currency || undefined,
    }),
    [filterValues],
  );

  const { data, isLoading } = useRevenue(revenueFilters);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Gelir', value: data.kpis.totalRevenue, format: 'currency', color: 'green', icon: '💰' },
        { label: 'Ort. Fırsat Değeri', value: data.kpis.avgDealValue, format: 'currency', color: 'cyan', icon: '📊' },
        { label: 'En Büyük Fırsat', value: data.kpis.largestDeal.value, format: 'currency', color: 'amber', icon: '🏆' },
        { label: 'Aylık Ort. Gelir', value: data.kpis.monthlyAvgRevenue, format: 'currency', color: 'violet', icon: '📅' },
      ]
    : [];

  const monthlyRevenueData = useMemo(
    () => (data?.monthlyRevenueTrend ?? []).map((m) => ({ name: m.month, Gelir: m.value })),
    [data],
  );

  const revenueByFairData = useMemo(
    () => (data?.revenueByFair ?? []).map((f) => ({ name: f.fairName, Gelir: f.revenue })),
    [data],
  );

  const revenueByProductData = useMemo(
    () => (data?.revenueByProduct ?? []).map((p) => ({ name: p.productName, Gelir: p.revenue })),
    [data],
  );

  const currencyPieData = useMemo(
    () =>
      (data?.currencyDistribution ?? []).map((c, i) => ({
        name: c.currency,
        value: c.value,
        color: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
      })),
    [data],
  );

  const customerTreemapData = useMemo(
    () =>
      (data?.revenueByCustomerTreemap ?? []).map((c) => ({
        name: c.customerCompany,
        value: c.revenue,
      })),
    [data],
  );

  const avgDealTrendData = useMemo(
    () => (data?.avgDealValueTrend ?? []).map((m) => ({ name: m.month, Değer: m.avgValue })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Gelir Analizi"
      subtitle="Kazanılan fırsatların gelir dağılımı, trendleri ve müşteri bazlı görünüm"
      isLoading={isLoading}
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
        filename: 'gelir-analizi',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Aylık Gelir Trendi" subtitle="Son 12 ay" delay={0.5}>
          <ReportAreaChart
            data={monthlyRevenueData}
            areas={[{ dataKey: 'Gelir', name: 'Gelir', color: CHART_COLORS.positive }]}
            height={300}
            showLegend={false}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
        <AnalyticsCard title="Aylık Ort. Fırsat Değeri Trendi" subtitle="Kapanan fırsatlar — dönem başına ortalama" delay={0.55}>
          <ReportLineChart
            data={avgDealTrendData}
            lines={[{ dataKey: 'Değer', name: 'Ort. Değer', color: CHART_COLORS.primary[1] }]}
            height={300}
            showLegend={false}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Fuara Göre Gelir" delay={0.6}>
          <ReportBarChart
            data={revenueByFairData}
            bars={[{ dataKey: 'Gelir', name: 'Gelir', color: CHART_COLORS.positive }]}
            height={300}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
        <AnalyticsCard title="Ürüne Göre Gelir" delay={0.65}>
          <ReportBarChart
            data={revenueByProductData}
            bars={[{ dataKey: 'Gelir', name: 'Gelir', color: CHART_COLORS.primary[0] }]}
            height={300}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Para Birimi Dağılımı" delay={0.7}>
          <ReportPieChart data={currencyPieData} height={280} innerRadius={50} formatter={formatCurrency} />
        </AnalyticsCard>
        <AnalyticsCard title="Müşteri Bazlı Gelir" subtitle="Treemap — şirket bazlı pay" delay={0.75}>
          <ReportTreemap data={customerTreemapData} height={280} formatter={formatCurrency} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Kapanan Fırsatlar"
        badge={data ? `${data.tableData.length} kayıt` : undefined}
        delay={0.85}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="closedAt"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
