'use client';

import { useMemo } from 'react';
import { useProductFairMatrix } from '@/hooks/use-product-reports';
import { ReportDashboardLayout, ReportTable } from '@/components/reports';
import { ReportHeatmap } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import type { ReportTableColumn } from '@crm/shared';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'productName', label: 'Ürün', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'tonnage', label: 'Tonaj', sortable: true, align: 'right', format: 'number' },
  { key: 'wonTonnage', label: 'Kazanılan Tonaj', sortable: true, align: 'right', format: 'number' },
  { key: 'winRate', label: 'Kazanma Oranı', sortable: true, align: 'right', format: 'percent' },
];

function buildHeatmapFromMatrix(
  rows: Array<{ productName: string; fairs: Record<string, number> }>,
): { cells: Array<{ row: string; col: string; value: number }>; rowLabels: string[]; colLabels: string[] } {
  const rowLabels = rows.map((r) => r.productName);
  const colSet = new Set<string>();
  for (const r of rows) {
    Object.keys(r.fairs).forEach((k) => colSet.add(k));
  }
  const colLabels = [...colSet].sort((a, b) => a.localeCompare(b, 'tr'));
  const cells: Array<{ row: string; col: string; value: number }> = [];
  for (const r of rows) {
    for (const col of colLabels) {
      cells.push({ row: r.productName, col, value: r.fairs[col] ?? 0 });
    }
  }
  return { cells, rowLabels, colLabels };
}

export function ProductFairMatrixDashboard() {
  const { data, isLoading } = useProductFairMatrix({});

  const opportunityHm = useMemo(
    () => buildHeatmapFromMatrix(data?.opportunityMatrix ?? []),
    [data],
  );

  const tonnageHm = useMemo(
    () => buildHeatmapFromMatrix(data?.tonnageMatrix ?? []),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Ürün × Fuar Matrisi"
      subtitle="Ürün ve fuar kesişiminde fırsat ve tonaj yoğunluğu"
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnalyticsCard title="Fırsat Matrisi" subtitle="Satır: ürün · Sütun: fuar" delay={0.45}>
          {opportunityHm.rowLabels.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/35">Matris verisi yok</div>
          ) : (
            <ReportHeatmap
              data={opportunityHm.cells}
              rowLabels={opportunityHm.rowLabels}
              colLabels={opportunityHm.colLabels}
              colorScale={['#0f172a', '#8b5cf6']}
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Tonaj Matrisi" subtitle="Satır: ürün · Sütun: fuar" delay={0.55}>
          {tonnageHm.rowLabels.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/35">Matris verisi yok</div>
          ) : (
            <ReportHeatmap
              data={tonnageHm.cells}
              rowLabels={tonnageHm.rowLabels}
              colLabels={tonnageHm.colLabels}
              colorScale={['#0c4a6e', '#22d3ee']}
              formatter={(n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
            />
          )}
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Ürün–Fuar Detay"
        badge={data ? `${data.tableData.length} satır` : undefined}
        delay={0.65}
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
