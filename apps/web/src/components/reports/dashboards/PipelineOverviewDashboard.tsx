'use client';

import { useState, useMemo } from 'react';
import { usePipelineOverview } from '@/hooks/use-pipeline-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportPieChart, ReportTreemap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const PIPELINE_STAGE_LABEL_FALLBACK: Record<string, string> = {
  tanisma: 'Tanışma',
  toplanti: 'Toplantı',
  teklif: 'Teklif',
  sozlesme: 'Sözleşme',
  satisa_donustu: 'Satışa Dönüştü',
  olumsuz: 'Olumsuz',
};

const FILTERS: FilterConfig[] = [
  {
    key: 'conversionRate', label: 'Dönüşüm Oranı', type: 'select',
    options: [
      { value: 'very_high', label: 'Çok Yüksek' }, { value: 'high', label: 'Yüksek' },
      { value: 'medium', label: 'Orta' }, { value: 'low', label: 'Düşük' }, { value: 'very_low', label: 'Çok Düşük' },
    ], placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'stage', label: 'Aşama', sortable: true },
  { key: 'budget', label: 'Bütçe', sortable: true, align: 'right', format: 'currency' },
  { key: 'currency', label: 'Birim', align: 'center' },
  { key: 'conversionRate', label: 'Dönüşüm', sortable: true },
  { key: 'createdAt', label: 'Oluşturma', sortable: true, align: 'right', format: 'date' },
  { key: 'updatedAt', label: 'Güncelleme', sortable: true, align: 'right', format: 'date' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function PipelineOverviewDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = usePipelineOverview(filterValues);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Açık Fırsat', value: data.kpis.openOpportunities, format: 'number', color: 'cyan', icon: '🔄' },
        { label: 'Pipeline Değeri', value: data.kpis.pipelineValue, format: 'currency', color: 'violet', icon: '💰' },
        { label: 'Ort. Fırsat Değeri', value: data.kpis.avgDealValue, format: 'currency', color: 'orange', icon: '📊' },
        { label: 'Teklif Aşaması', value: data.kpis.proposalStageCount, format: 'number', color: 'amber', icon: '📋' },
      ]
    : [];

  const funnelData = useMemo(
    () =>
      (data?.funnel ?? []).map((f) => ({
        name:
          f.label && String(f.label).trim() !== ''
            ? f.label
            : PIPELINE_STAGE_LABEL_FALLBACK[f.stage] ?? f.stage,
        Adet: f.count,
      })),
    [data],
  );

  const stagePieData = useMemo(
    () => (data?.stageDistributionPie ?? []).filter((s) => s.count > 0).map((s, i) => ({
      name: s.label, value: s.count,
      color: (CHART_COLORS.stage as Record<string, string>)[s.stage] ?? CHART_COLORS.primary[i],
    })),
    [data],
  );

  const convPieData = useMemo(
    () => (data?.conversionRatePie ?? []).filter((c) => c.count > 0).map((c, i) => ({
      name: c.label, value: c.count,
      color: (CHART_COLORS.conversion as Record<string, string>)[c.rate] ?? CHART_COLORS.primary[i],
    })),
    [data],
  );

  const treemapItems = useMemo(
    () => (data?.treemapData ?? []).flatMap((f) =>
      f.stages.map((s) => ({ name: `${f.fairName} — ${s.stage}`, value: s.value })),
    ),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Pipeline Genel Bakış"
      subtitle="Satış hunisinin anlık durumu: aşama dağılımı, değerler, darboğazlar"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      filterBar={<ReportFilterBar filters={FILTERS} values={filterValues} onChange={handleFilterChange} onReset={handleReset} />}
      csvExportConfig={{
        rows: data?.tableData ?? [],
        columns: TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'pipeline-genel-bakis',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => <KpiCard key={kpi.label} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Pipeline Funnel" subtitle="Aşama bazlı fırsat sayısı" delay={0.5}>
          <ReportBarChart data={funnelData} bars={[{ dataKey: 'Adet', name: 'Fırsat', color: CHART_COLORS.neutral }]} layout="vertical" height={250} showLegend={false} />
        </AnalyticsCard>
        <AnalyticsCard title="Aşama Bazlı Pipeline Değeri" delay={0.6}>
          <ReportBarChart
            data={(data?.stageValues ?? []).map((s) => ({ name: s.label, Değer: s.totalValue }))}
            bars={[{ dataKey: 'Değer', name: 'Pipeline Değeri', color: CHART_COLORS.neutral }]}
            height={250} showLegend={false} formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Aşama Dağılımı" delay={0.7}>
          <ReportPieChart data={stagePieData} height={240} innerRadius={45} />
        </AnalyticsCard>
        <AnalyticsCard title="Dönüşüm Oranı Dağılımı" delay={0.8}>
          <ReportPieChart data={convPieData} height={240} innerRadius={45} />
        </AnalyticsCard>
        <AnalyticsCard title="Fuar × Aşama Treemap" subtitle="Büyüklük: bütçe değeri" delay={0.9}>
          <ReportTreemap data={treemapItems} height={240} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard title="Pipeline Detay Tablosu" badge={data ? `${data.tableData.length} fırsat` : undefined} delay={1.0}>
        <ReportTable columns={TABLE_COLUMNS} rows={data?.tableData ?? []} defaultSortBy="budget" defaultSortOrder="desc" maxRows={20} />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
