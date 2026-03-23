'use client';

import { useState, useMemo } from 'react';
import { useProductAnalysis } from '@/hooks/use-product-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportPieChart, ReportTreemap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  {
    key: 'stageFilter',
    label: 'Aşama',
    type: 'select',
    options: [
      { value: 'tanisma', label: 'Tanışma' },
      { value: 'toplanti', label: 'Toplantı' },
      { value: 'teklif', label: 'Teklif' },
      { value: 'sozlesme', label: 'Sözleşme' },
      { value: 'satisa_donustu', label: 'Satışa Dönüştü' },
      { value: 'olumsuz', label: 'Olumsuz' },
    ],
    placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'productName', label: 'Ürün', sortable: true },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'totalTonnage', label: 'Toplam Tonaj', sortable: true, align: 'right', format: 'number' },
  { key: 'wonTonnage', label: 'Kazanılan Tonaj', sortable: true, align: 'right', format: 'number' },
  { key: 'winRate', label: 'Kazanma Oranı', sortable: true, align: 'right', format: 'percent' },
  { key: 'fairCount', label: 'Fuar Sayısı', sortable: true, align: 'right', format: 'number' },
];

const formatTonnage = (val: unknown) =>
  `${Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} t`;

export function ProductAnalysisDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const filters = useMemo(
    () => ({
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
      stageFilter: filterValues.stageFilter || undefined,
    }),
    [filterValues],
  );
  const { data, isLoading } = useProductAnalysis(filters);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Ürün', value: data.kpis.totalProducts, format: 'number', color: 'violet', icon: '📦' },
        {
          label: 'En Popüler Ürün',
          value: `${data.kpis.mostPopularProduct.name} – ${data.kpis.mostPopularProduct.count} fırsat`,
          format: 'text',
          color: 'cyan',
          icon: '⭐',
        },
        { label: 'Toplam Tonaj', value: data.kpis.totalTonnage, format: 'number', color: 'amber', icon: '⚖️' },
        { label: 'Kazanılan Tonaj', value: data.kpis.wonTonnage, format: 'number', color: 'green', icon: '✅' },
      ]
    : [];

  const popularityData = useMemo(
    () =>
      (data?.productPopularity ?? []).map((p) => ({
        name: p.productName,
        Fırsat: p.opportunityCount,
      })),
    [data],
  );

  const tonnageBarData = useMemo(
    () =>
      (data?.productTonnage ?? []).map((p) => ({
        name: p.productName,
        Tonaj: p.tonnage,
      })),
    [data],
  );

  const tonnagePieData = useMemo(
    () =>
      (data?.tonnageDistribution ?? [])
        .filter((p) => p.tonnage > 0)
        .map((p, i) => ({
          name: p.productName,
          value: p.tonnage,
          color: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
        })),
    [data],
  );

  const treemapData = useMemo(
    () =>
      (data?.productTreemap ?? []).map((p) => ({
        name: p.productName,
        value: p.opportunityCount,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Ürün Analizi"
      subtitle="Ürün bazlı fırsat, tonaj ve kazanma dağılımı"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'urun-analizi',
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Ürün Popülerliği" subtitle="Fırsat sayısına göre" delay={0.5}>
          <ReportBarChart
            data={popularityData}
            bars={[{ dataKey: 'Fırsat', name: 'Fırsat', color: CHART_COLORS.primary[1] }]}
            layout="vertical"
            height={320}
            showLegend={false}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Ürün Tonajı" subtitle="Ürün bazlı toplam tonaj" delay={0.55}>
          <ReportBarChart
            data={tonnageBarData}
            bars={[{ dataKey: 'Tonaj', name: 'Tonaj', color: CHART_COLORS.primary[5] }]}
            height={320}
            showLegend={false}
            formatter={formatTonnage}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Tonaj Dağılımı" subtitle="Ürünlere göre tonaj payı" delay={0.65}>
          <ReportPieChart data={tonnagePieData} height={280} innerRadius={50} formatter={formatTonnage} />
        </AnalyticsCard>

        <AnalyticsCard title="Ürün Haritası" subtitle="Fırsat sayısı (treemap)" delay={0.7}>
          <ReportTreemap data={treemapData} height={280} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Ürün Detay Tablosu"
        badge={data ? `${data.tableData.length} ürün` : undefined}
        delay={0.8}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="opportunityCount"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
