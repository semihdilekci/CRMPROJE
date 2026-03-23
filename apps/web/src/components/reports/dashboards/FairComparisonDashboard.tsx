'use client';

import { useState, useMemo } from 'react';
import { useFairComparison } from '@/hooks/use-fair-reports';
import { useFairs } from '@/hooks/use-fairs';
import { ReportDashboardLayout, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportHeatmap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { ReportTableColumn } from '@crm/shared';

const STAGE_LABELS: Record<string, string> = {
  tanisma: 'Tanışma',
  toplanti: 'Toplantı',
  teklif: 'Teklif',
  sozlesme: 'Sözleşme',
  satisa_donustu: 'Kazanılan',
  olumsuz: 'Olumsuz',
};

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'metric', label: 'Metrik', sortable: false },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function FairComparisonDashboard() {
  const { data: fairs } = useFairs();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data, isLoading } = useFairComparison(selectedIds);

  const toggleFair = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const oppBarData = useMemo(
    () =>
      (data?.fairs ?? []).map((f) => ({
        name: f.fairName,
        Kazanılan: f.won,
        Kaybedilen: f.lost,
        Açık: f.open,
      })),
    [data],
  );

  const revenueBarData = useMemo(
    () =>
      (data?.fairs ?? []).map((f) => ({
        name: f.fairName,
        Pipeline: f.pipelineValue,
        Gelir: f.wonRevenue,
      })),
    [data],
  );

  const tonnageBarData = useMemo(
    () =>
      (data?.fairs ?? []).map((f) => ({
        name: f.fairName,
        'Toplam Tonaj': f.totalTonnage,
        'Kazanılan Tonaj': f.wonTonnage,
      })),
    [data],
  );

  const conversionBarData = useMemo(
    () =>
      (data?.fairs ?? []).map((f) => ({
        name: f.fairName,
        Oran: f.conversionRate,
      })),
    [data],
  );

  const stageHeatmapData = useMemo(() => {
    if (!data?.stageMatrix) return { cells: [] as { row: string; col: string; value: number }[], rows: [] as string[], cols: Object.values(STAGE_LABELS) };
    const rows = data.stageMatrix.map((s) => s.fairName);
    const cols = Object.keys(STAGE_LABELS).map((k) => STAGE_LABELS[k]!);
    const cells: { row: string; col: string; value: number }[] = [];
    for (const entry of data.stageMatrix) {
      for (const [stageKey, count] of Object.entries(entry.stages)) {
        cells.push({ row: entry.fairName, col: STAGE_LABELS[stageKey] ?? stageKey, value: count });
      }
    }
    return { cells, rows, cols };
  }, [data]);

  const productHeatmapData = useMemo(() => {
    if (!data?.productMatrix) return { cells: [] as { row: string; col: string; value: number }[], rows: [] as string[], cols: [] as string[] };
    const rows = data.productMatrix.map((p) => p.fairName);
    const productSet = new Set<string>();
    for (const entry of data.productMatrix) {
      for (const k of Object.keys(entry.products)) productSet.add(k);
    }
    const cols = [...productSet];
    const cells: { row: string; col: string; value: number }[] = [];
    for (const entry of data.productMatrix) {
      for (const [product, qty] of Object.entries(entry.products)) {
        cells.push({ row: entry.fairName, col: product, value: qty });
      }
    }
    return { cells, rows, cols };
  }, [data]);

  const comparisonTable = useMemo(() => {
    if (!data?.fairs?.length) return { columns: TABLE_COLUMNS, rows: [] };
    const cols: ReportTableColumn[] = [
      { key: 'metric', label: 'Metrik', sortable: false },
      ...data.fairs.map((f) => ({ key: f.fairId, label: f.fairName, sortable: false, align: 'right' as const })),
    ];
    const metrics = [
      { metric: 'Toplam Fırsat', key: 'total' },
      { metric: 'Kazanılan', key: 'won' },
      { metric: 'Kaybedilen', key: 'lost' },
      { metric: 'Açık', key: 'open' },
      { metric: 'Dönüşüm Oranı (%)', key: 'conversionRate' },
      { metric: 'Kazanılan Gelir', key: 'wonRevenue' },
      { metric: 'Pipeline Değeri', key: 'pipelineValue' },
      { metric: 'Toplam Tonaj', key: 'totalTonnage' },
      { metric: 'Ort. Fırsat Değeri', key: 'avgDealValue' },
    ];
    const rows = metrics.map((m) => {
      const row: Record<string, unknown> = { metric: m.metric };
      for (const f of data.fairs) {
        const raw = (f as unknown as Record<string, number>)[m.key];
        row[f.fairId] = ['wonRevenue', 'pipelineValue', 'avgDealValue'].includes(m.key)
          ? formatCurrency(raw)
          : typeof raw === 'number' && m.key === 'conversionRate'
            ? `%${raw.toFixed(1)}`
            : typeof raw === 'number'
              ? raw.toLocaleString('tr-TR')
              : raw;
      }
      return row;
    });
    return { columns: cols, rows };
  }, [data]);

  return (
    <ReportDashboardLayout
      title="Fuar Karşılaştırma"
      subtitle="Seçilen fuarları birebir karşılaştır: fırsat, gelir, tonaj, dönüşüm"
      isLoading={isLoading && selectedIds.length >= 2}
      csvExportConfig={{
        rows: comparisonTable.rows,
        columns: comparisonTable.columns.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'fuar-karsilastirma',
      }}
    >
      {/* Fair selector */}
      <div
        className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-4 backdrop-blur-lg"
        style={{ opacity: 0, animation: 'fadeUp 0.4s ease 0.1s forwards' }}
      >
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Karşılaştırılacak fuarları seçin (2-5)
        </div>
        <div className="flex flex-wrap gap-2">
          {(fairs ?? []).map((fair) => {
            const isSelected = selectedIds.includes(fair.id);
            return (
              <button
                key={fair.id}
                onClick={() => toggleFair(fair.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                    : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white/80'
                }`}
              >
                {fair.name}
              </button>
            );
          })}
        </div>
        {selectedIds.length < 2 && (
          <p className="mt-2 text-[11px] text-white/30">En az 2 fuar seçin</p>
        )}
      </div>

      {data && selectedIds.length >= 2 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnalyticsCard title="Fırsat Sayıları" delay={0.3}>
              <ReportBarChart
                data={oppBarData}
                bars={[
                  { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive },
                  { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative },
                  { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral },
                ]}
                height={280}
              />
            </AnalyticsCard>

            <AnalyticsCard title="Gelir Karşılaştırma" delay={0.4}>
              <ReportBarChart
                data={revenueBarData}
                bars={[
                  { dataKey: 'Pipeline', name: 'Pipeline', color: CHART_COLORS.neutral },
                  { dataKey: 'Gelir', name: 'Kazanılan', color: CHART_COLORS.positive },
                ]}
                height={280}
                formatter={formatCurrency}
              />
            </AnalyticsCard>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnalyticsCard title="Tonaj Karşılaştırma" delay={0.5}>
              <ReportBarChart
                data={tonnageBarData}
                bars={[
                  { dataKey: 'Toplam Tonaj', name: 'Toplam', color: CHART_COLORS.neutral },
                  { dataKey: 'Kazanılan Tonaj', name: 'Kazanılan', color: CHART_COLORS.positive },
                ]}
                height={280}
              />
            </AnalyticsCard>

            <AnalyticsCard title="Dönüşüm Oranı" delay={0.6}>
              <ReportBarChart
                data={conversionBarData}
                bars={[{ dataKey: 'Oran', name: 'Dönüşüm %', color: '#fbbf24' }]}
                height={280}
                showLegend={false}
                formatter={(val) => `%${Number(val).toFixed(1)}`}
              />
            </AnalyticsCard>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnalyticsCard title="Fuar × Aşama Matrisi" subtitle="Fırsat sayıları" delay={0.7}>
              <ReportHeatmap
                data={stageHeatmapData.cells}
                rowLabels={stageHeatmapData.rows}
                colLabels={stageHeatmapData.cols}
              />
            </AnalyticsCard>

            <AnalyticsCard title="Fuar × Ürün Matrisi" subtitle="Tonaj yoğunluğu" delay={0.8}>
              <ReportHeatmap
                data={productHeatmapData.cells}
                rowLabels={productHeatmapData.rows}
                colLabels={productHeatmapData.cols}
                colorScale={['#0e3a4a', '#06b6d4']}
                formatter={(v) => `${v.toFixed(1)}t`}
              />
            </AnalyticsCard>
          </div>

          <AnalyticsCard title="Karşılaştırma Özet Tablosu" delay={0.9}>
            <ReportTable
              columns={comparisonTable.columns}
              rows={comparisonTable.rows}
            />
          </AnalyticsCard>
        </>
      )}
    </ReportDashboardLayout>
  );
}
