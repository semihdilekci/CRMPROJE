'use client';

import { useState, useMemo } from 'react';
import { usePipelineVelocity } from '@/hooks/use-pipeline-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportLineChart, ReportScatterChart, ReportHeatmap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const STAGE_LABELS: Record<string, string> = {
  tanisma: 'Tanışma', toplanti: 'Toplantı', teklif: 'Teklif', sozlesme: 'Sözleşme',
};

const FILTERS: FilterConfig[] = [
  {
    key: 'finalStatus', label: 'Son Durum', type: 'select',
    options: [{ value: 'won', label: 'Kazanılan' }, { value: 'lost', label: 'Kaybedilen' }],
    placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const SLOW_TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'stage', label: 'Aşama', sortable: true },
  { key: 'daysSinceLastChange', label: 'Gün', sortable: true, align: 'right', format: 'number' },
  { key: 'value', label: 'Değer', sortable: true, align: 'right', format: 'currency' },
];

export function PipelineVelocityDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = usePipelineVelocity(filterValues);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Ort. Satış Döngüsü', value: `${data.kpis.avgCycleDays} gün`, format: 'text', color: 'violet', icon: '⏱' },
        { label: 'Medyan Döngü', value: `${data.kpis.medianCycleDays} gün`, format: 'text', color: 'cyan', icon: '📊' },
        {
          label: 'En Uzun Bekleyen',
          value: `${data.kpis.longestWaiting.days} gün`,
          format: 'text', color: 'red', icon: '⚠️',
        },
      ]
    : [];

  const stageBarData = useMemo(
    () => (data?.stageAvgDays ?? []).map((s) => ({ name: s.label, Gün: s.avgDays })),
    [data],
  );

  const trendData = useMemo(
    () => (data?.monthlyCycleTrend ?? []).map((m) => ({ name: m.month, Gün: m.avgDays })),
    [data],
  );

  const scatterSeries = useMemo(() => {
    const wonData = (data?.scatterData ?? []).filter((d) => d.won).map((d) => ({ value: d.value, cycleDays: d.cycleDays }));
    const lostData = (data?.scatterData ?? []).filter((d) => !d.won).map((d) => ({ value: d.value, cycleDays: d.cycleDays }));
    return [
      { name: 'Kazanılan', data: wonData, color: CHART_COLORS.positive },
      { name: 'Kaybedilen', data: lostData, color: CHART_COLORS.negative },
    ];
  }, [data]);

  const heatmapData = useMemo(() => {
    if (!data?.fairStageHeatmap?.length) return { cells: [] as { row: string; col: string; value: number }[], rows: [] as string[], cols: Object.values(STAGE_LABELS) };
    const rows = data.fairStageHeatmap.map((f) => f.fairName);
    const cols = Object.values(STAGE_LABELS);
    const cells: { row: string; col: string; value: number }[] = [];
    for (const entry of data.fairStageHeatmap) {
      for (const [stageKey, days] of Object.entries(entry.stages)) {
        cells.push({ row: entry.fairName, col: STAGE_LABELS[stageKey] ?? stageKey, value: days });
      }
    }
    return { cells, rows, cols };
  }, [data]);

  return (
    <ReportDashboardLayout
      title="Pipeline Hız Analizi"
      subtitle="Fırsatların aşamalar arası geçiş hızları ve darboğaz tespiti"
      isLoading={isLoading}
      filterBar={<ReportFilterBar filters={FILTERS} values={filterValues} onChange={handleFilterChange} onReset={handleReset} />}
      csvExportConfig={{
        rows: data?.slowOpportunities ?? [],
        columns: SLOW_TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'pipeline-hiz',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => <KpiCard key={kpi.label} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Aşama Bazlı Ort. Bekleme Süresi" subtitle="Gün" delay={0.5}>
          <ReportBarChart data={stageBarData} bars={[{ dataKey: 'Gün', name: 'Ortalama Gün', color: CHART_COLORS.neutral }]} height={260} showLegend={false} />
        </AnalyticsCard>
        <AnalyticsCard title="Aylık Ort. Satış Döngüsü Trendi" subtitle="Son 12 ay" delay={0.6}>
          <ReportLineChart data={trendData} lines={[{ dataKey: 'Gün', name: 'Ort. Gün', color: '#06b6d4' }]} height={260} showLegend={false} />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Fırsat Değeri vs Döngü Süresi" subtitle="Büyük fırsatlar daha mı uzun sürüyor?" delay={0.7}>
          <ReportScatterChart
            series={scatterSeries}
            xKey="value" yKey="cycleDays"
            xLabel="Bütçe Değeri" yLabel="Gün"
            height={280}
          />
        </AnalyticsCard>
        <AnalyticsCard title="Fuar × Aşama Ort. Süre" subtitle="Gün (heatmap)" delay={0.8}>
          <ReportHeatmap
            data={heatmapData.cells}
            rowLabels={heatmapData.rows}
            colLabels={heatmapData.cols}
            formatter={(v) => `${v} gün`}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard title="Yavaş Fırsatlar" subtitle="30+ gün aşama değişikliği olmayan fırsatlar" badge={data ? `${data.slowOpportunities.length}` : undefined} delay={0.9}>
        <ReportTable columns={SLOW_TABLE_COLUMNS} rows={data?.slowOpportunities ?? []} defaultSortBy="daysSinceLastChange" defaultSortOrder="desc" />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
