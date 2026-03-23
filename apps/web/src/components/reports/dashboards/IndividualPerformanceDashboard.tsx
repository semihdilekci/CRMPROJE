'use client';

import { useMemo } from 'react';
import { useIndividualPerformance } from '@/hooks/use-team-reports';
import { ReportDashboardLayout, Leaderboard, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportScatterChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { LeaderboardItem, ReportTableColumn } from '@crm/shared';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'name', label: 'Kişi', sortable: true },
  { key: 'teamName', label: 'Takım', sortable: true },
  { key: 'opportunityCount', label: 'Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'won', label: 'Kazanılan', sortable: true, align: 'right', format: 'number' },
  { key: 'winRate', label: 'Kazanma Oranı', sortable: true, align: 'right', format: 'percent' },
  { key: 'wonRevenue', label: 'Kazanılan Gelir', sortable: true, align: 'right', format: 'currency' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function IndividualPerformanceDashboard() {
  const { data, isLoading } = useIndividualPerformance({});

  const revenueData = useMemo(
    () =>
      (data?.revenueByUser ?? []).map((u) => ({
        name: u.name,
        Gelir: u.revenue,
      })),
    [data],
  );

  const pipelineStackData = useMemo(
    () =>
      (data?.pipelineByUser ?? []).map((u) => ({
        name: u.name,
        Açık: u.open,
        Kazanılan: u.won,
        Kaybedilen: u.lost,
      })),
    [data],
  );

  const scatterSeries = useMemo(
    () => [
      {
        name: 'Kullanıcılar',
        data: (data?.scatterData ?? []).map((d) => ({
          name: d.name,
          opportunityCount: d.opportunityCount,
          winRate: d.winRate,
          revenue: d.revenue,
        })),
        color: CHART_COLORS.neutral,
      },
    ],
    [data],
  );

  const scatterFormatter = (val: unknown, name: string) => {
    if (name === 'winRate') return `%${Number(val).toFixed(1)}`;
    if (name === 'revenue') return formatCurrency(val);
    return Number(val).toLocaleString('tr-TR');
  };

  const leaderboardItems: LeaderboardItem[] = useMemo(
    () =>
      (data?.leaderboard ?? []).map((u, i) => ({
        rank: i + 1,
        label: u.name,
        sublabel: `${u.won} / ${u.opportunityCount} fırsat · ${u.teamName}`,
        value: formatCurrency(u.revenue),
        secondary: `%${u.winRate.toFixed(1)} kazanma`,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Bireysel Performans"
      subtitle="Kullanıcı bazlı gelir, pipeline ve kazanma analizi"
      isLoading={isLoading}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'bireysel-performans',
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Kişi Bazlı Gelir" subtitle="Kazanılan gelir" delay={0.45}>
          <ReportBarChart
            data={revenueData}
            bars={[{ dataKey: 'Gelir', name: 'Gelir', color: CHART_COLORS.positive }]}
            height={300}
            showLegend={false}
            formatter={formatCurrency}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Pipeline Durumu" subtitle="Açık · Kazanılan · Kaybedilen (yığılmış)" delay={0.5}>
          <ReportBarChart
            data={pipelineStackData}
            bars={[
              { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral, stackId: 's' },
              { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive, stackId: 's' },
              { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative, stackId: 's' },
            ]}
            height={300}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard
          title="Fırsat Sayısı vs Kazanma Oranı"
          subtitle="Nokta boyutu: gelir"
          delay={0.6}
        >
          <ReportScatterChart
            series={scatterSeries}
            xKey="opportunityCount"
            yKey="winRate"
            zKey="revenue"
            xLabel="Fırsat sayısı"
            yLabel="Kazanma oranı (%)"
            height={320}
            showLegend={false}
            formatter={scatterFormatter}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Bireysel Sıralama" subtitle="Gelire göre" delay={0.65}>
          <Leaderboard items={leaderboardItems} maxItems={10} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Bireysel Detay Tablosu"
        badge={data ? `${data.tableData.length} kişi` : undefined}
        delay={0.75}
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
