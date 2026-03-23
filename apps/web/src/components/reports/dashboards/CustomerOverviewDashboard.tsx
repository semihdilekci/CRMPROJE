'use client';

import { useMemo, useState } from 'react';
import { useCustomerOverview } from '@/hooks/use-customer-reports';
import {
  ReportDashboardLayout,
  KpiCard,
  ReportFilterBar,
  ReportTable,
  type FilterConfig,
} from '@/components/reports';
import { ReportBarChart, ReportPieChart, ReportTreemap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  {
    key: 'conversionRate',
    label: 'Dönüşüm Oranı',
    type: 'select',
    options: [
      { value: 'very_high', label: 'Çok Yüksek' },
      { value: 'high', label: 'Yüksek' },
      { value: 'medium', label: 'Orta' },
      { value: 'low', label: 'Düşük' },
      { value: 'very_low', label: 'Çok Düşük' },
    ],
    placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'company', label: 'Şirket', sortable: true },
  { key: 'name', label: 'Yetkili', sortable: true },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'won', label: 'Kazanılan', sortable: true, align: 'right', format: 'number' },
  { key: 'lost', label: 'Kaybedilen', sortable: true, align: 'right', format: 'number' },
  { key: 'open', label: 'Açık', sortable: true, align: 'right', format: 'number' },
  { key: 'totalBudget', label: 'Toplam Bütçe', sortable: true, align: 'right', format: 'currency' },
  { key: 'conversionRate', label: 'Dönüşüm', sortable: true, align: 'right', format: 'percent' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '₺0';
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function CustomerOverviewDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useCustomerOverview({
    conversionRate: filterValues.conversionRate || undefined,
    startDate: filterValues.startDate || undefined,
    endDate: filterValues.endDate || undefined,
  });

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Müşteri', value: data.kpis.totalCustomers, format: 'number', color: 'violet', icon: '👥' },
        { label: 'Aktif Müşteri', value: data.kpis.activeCustomers, format: 'number', color: 'cyan', icon: '✨' },
        {
          label: 'Ort. Fırsat/Müşteri',
          value: data.kpis.avgOpportunitiesPerCustomer,
          format: 'number',
          color: 'amber',
          icon: '🔄',
        },
        {
          label: 'Müşteri Dönüşüm Oranı',
          value: data.kpis.customerConversionRate,
          format: 'percent',
          color: 'green',
          icon: '📈',
        },
      ]
    : [];

  const monthlyNewData = useMemo(
    () => (data?.monthlyNewCustomerTrend ?? []).map((m) => ({ name: m.month, Müşteri: m.count })),
    [data],
  );

  const topOppData = useMemo(
    () =>
      (data?.topCustomersByOpportunities ?? []).map((c) => ({
        name: c.company,
        Fırsat: c.count,
      })),
    [data],
  );

  const statusPieData = useMemo(
    () =>
      (data?.customerStatusDistribution ?? []).map((s, i) => ({
        name: s.status,
        value: s.count,
        color: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
      })),
    [data],
  );

  const treemapData = useMemo(
    () =>
      (data?.portfolioTreemap ?? []).map((p) => ({
        name: p.company,
        value: p.totalValue,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Müşteri Genel Bakış"
      subtitle="Müşteri hacmi, dağılım ve portföy özeti"
      isLoading={isLoading}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'musteri-genel-bakis',
      }}
      filterBar={
        <ReportFilterBar
          filters={FILTERS}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Aylık Yeni Müşteri" subtitle="Kayıt trendi" delay={0.5}>
          <ReportBarChart
            data={monthlyNewData}
            bars={[{ dataKey: 'Müşteri', name: 'Müşteri', color: CHART_COLORS.positive }]}
            height={300}
            showLegend={false}
          />
        </AnalyticsCard>

        <AnalyticsCard title="En Çok Fırsatı Olan Müşteriler" subtitle="Şirket bazlı fırsat sayısı" delay={0.6}>
          <ReportBarChart
            data={topOppData}
            bars={[{ dataKey: 'Fırsat', name: 'Fırsat', color: CHART_COLORS.neutral }]}
            layout="vertical"
            height={300}
            showLegend={false}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Müşteri Durum Dağılımı" delay={0.7}>
          <ReportPieChart data={statusPieData} height={280} innerRadius={50} showLabel={false} />
        </AnalyticsCard>

        <AnalyticsCard title="Müşteri Portföyü" subtitle="Toplam değere göre treemap" delay={0.8}>
          <ReportTreemap data={treemapData} height={280} formatter={formatCurrency} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Müşteri Detay Tablosu"
        badge={data ? `${data.tableData.length} kayıt` : undefined}
        delay={0.9}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="totalBudget"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
