'use client';

import { useMemo } from 'react';
import { useCustomerSegmentation } from '@/hooks/use-customer-reports';
import { ReportDashboardLayout, ReportTable } from '@/components/reports';
import {
  ReportBarChart,
  ReportHeatmap,
  ReportPieChart,
  ReportScatterChart,
} from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { ReportTableColumn } from '@crm/shared';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'company', label: 'Şirket', sortable: true },
  { key: 'segment', label: 'Segment', sortable: true },
  { key: 'totalValue', label: 'Toplam Değer', sortable: true, align: 'right', format: 'currency' },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'winRate', label: 'Kazanma Oranı', sortable: true, align: 'right', format: 'percent' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '₺0';
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

const segmentScatterFormatter = (val: unknown, name: string) => {
  if (name === 'totalValue') return formatCurrency(val);
  return Number(val).toLocaleString('tr-TR');
};

export function CustomerSegmentationDashboard() {
  const { data, isLoading } = useCustomerSegmentation();

  const scatterSeries = useMemo(
    () => [
      {
        name: 'Müşteriler',
        data: (data?.scatterData ?? []).map((d) => ({
          name: d.company,
          opportunityCount: d.opportunityCount,
          totalValue: d.totalValue,
        })),
        color: CHART_COLORS.neutral,
      },
    ],
    [data],
  );

  const stackedValueData = useMemo(
    () =>
      (data?.topCustomersByValue ?? []).map((c) => ({
        name: c.company,
        Kazanılan: c.wonValue,
        Açık: c.openValue,
        Kaybedilen: c.lostValue,
      })),
    [data],
  );

  const segmentPieData = useMemo(
    () =>
      (data?.conversionSegments ?? []).map((s, i) => ({
        name: s.segment,
        value: s.count,
        color: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
      })),
    [data],
  );

  const customersByFairData = useMemo(
    () =>
      (data?.customersByFair ?? []).map((f) => ({
        name: f.fairName,
        Müşteri: f.customerCount,
      })),
    [data],
  );

  const { heatmapCells, rowLabels, colLabels } = useMemo(() => {
    const matrix = data?.customerFairMatrix ?? [];
    const colSet = new Set<string>();
    for (const row of matrix) {
      for (const k of Object.keys(row.fairs)) colSet.add(k);
    }
    const cols = Array.from(colSet).sort((a, b) => a.localeCompare(b, 'tr'));
    const rows = matrix.map((m) => m.company);
    const cells: Array<{ row: string; col: string; value: number }> = [];
    for (const m of matrix) {
      for (const col of cols) {
        cells.push({ row: m.company, col, value: m.fairs[col] ?? 0 });
      }
    }
    return { heatmapCells: cells, rowLabels: rows, colLabels: cols };
  }, [data]);

  return (
    <ReportDashboardLayout
      title="Müşteri Segmentasyonu"
      subtitle="Değer, dönüşüm ve fuar bazlı müşteri dağılımı"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'musteri-segmentasyonu',
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard
          title="Fırsat Sayısı vs Toplam Değer"
          subtitle="Her nokta bir müşteri"
          delay={0.5}
        >
          <ReportScatterChart
            series={scatterSeries}
            xKey="opportunityCount"
            yKey="totalValue"
            xLabel="Fırsat Sayısı"
            yLabel="Toplam Değer"
            height={300}
            showLegend={false}
            formatter={segmentScatterFormatter}
          />
        </AnalyticsCard>

        <AnalyticsCard title="En Değerli Müşteriler" subtitle="Kazanılan / Açık / Kaybedilen" delay={0.55}>
          <ReportBarChart
            data={stackedValueData}
            bars={[
              { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive, stackId: 'v' },
              { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral, stackId: 'v' },
              { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative, stackId: 'v' },
            ]}
            height={300}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Dönüşüm Segmenti" delay={0.6}>
          <ReportPieChart data={segmentPieData} height={280} innerRadius={50} showLabel={false} />
        </AnalyticsCard>

        <AnalyticsCard title="Fuar Bazlı Müşteri Sayısı" delay={0.65}>
          <ReportBarChart
            data={customersByFairData}
            bars={[{ dataKey: 'Müşteri', name: 'Müşteri', color: CHART_COLORS.primary[1] }]}
            height={300}
            showLegend={false}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Müşteri × Fuar Matrisi"
        subtitle="Kesişimdeki fırsat veya müşteri yoğunluğu"
        delay={0.7}
      >
        {colLabels.length > 0 && rowLabels.length > 0 ? (
          <ReportHeatmap
            data={heatmapCells}
            rowLabels={rowLabels}
            colLabels={colLabels}
            formatter={(v) => v.toLocaleString('tr-TR')}
          />
        ) : (
          <div className="py-8 text-center text-sm text-white/40">Matris için veri yok</div>
        )}
      </AnalyticsCard>

      <AnalyticsCard
        title="Segment Özet Tablosu"
        badge={data ? `${data.tableData.length} kayıt` : undefined}
        delay={0.75}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="totalValue"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
