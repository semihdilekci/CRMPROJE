'use client';

import { useMemo } from 'react';
import { useTeamPerformance } from '@/hooks/use-team-reports';
import { ReportDashboardLayout, KpiCard, Leaderboard, ReportTable } from '@/components/reports';
import { ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { KpiItem, LeaderboardItem, ReportTableColumn } from '@crm/shared';

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'teamName', label: 'Takım', sortable: true },
  { key: 'memberCount', label: 'Üye', sortable: true, align: 'right', format: 'number' },
  { key: 'totalOpportunities', label: 'Toplam Fırsat', sortable: true, align: 'right', format: 'number' },
  { key: 'won', label: 'Kazanılan', sortable: true, align: 'right', format: 'number' },
  { key: 'lost', label: 'Kaybedilen', sortable: true, align: 'right', format: 'number' },
  { key: 'open', label: 'Açık', sortable: true, align: 'right', format: 'number' },
  { key: 'winRate', label: 'Kazanma Oranı', sortable: true, align: 'right', format: 'percent' },
  { key: 'pipelineValue', label: 'Pipeline', sortable: true, align: 'right', format: 'currency' },
  { key: 'wonRevenue', label: 'Gelir', sortable: true, align: 'right', format: 'currency' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function TeamPerformanceDashboard() {
  const { data, isLoading } = useTeamPerformance({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Takım', value: data.kpis.totalTeams, format: 'number', color: 'violet', icon: '👥' },
        {
          label: 'En Başarılı',
          value: `${data.kpis.bestTeam.name} (%${data.kpis.bestTeam.winRate.toFixed(1)})`,
          format: 'text',
          color: 'green',
          icon: '🏆',
        },
        {
          label: 'En Aktif',
          value: `${data.kpis.mostActiveTeam.name} – ${data.kpis.mostActiveTeam.opportunityCount} fırsat`,
          format: 'text',
          color: 'cyan',
          icon: '⚡',
        },
      ]
    : [];

  const oppCountsData = useMemo(
    () =>
      (data?.teamOpportunityCounts ?? []).map((t) => ({
        name: t.teamName,
        Kazanılan: t.won,
        Kaybedilen: t.lost,
        Açık: t.open,
      })),
    [data],
  );

  const revenueData = useMemo(
    () =>
      (data?.teamRevenue ?? []).map((t) => ({
        name: t.teamName,
        Pipeline: t.pipelineValue,
        Gelir: t.wonRevenue,
      })),
    [data],
  );

  const winRateData = useMemo(
    () =>
      (data?.teamWinRates ?? []).map((t) => ({
        name: t.teamName,
        Oran: t.winRate,
      })),
    [data],
  );

  const leaderboardItems: LeaderboardItem[] = useMemo(
    () =>
      (data?.leaderboard ?? []).map((t, i) => ({
        rank: i + 1,
        label: t.teamName,
        sublabel: `${t.won} / ${t.opportunityCount} kazanılan fırsat`,
        value: formatCurrency(t.totalRevenue),
        secondary: `%${t.winRate.toFixed(1)} kazanma`,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Takım Performansı"
      subtitle="Takımların fırsat, gelir ve kazanma karşılaştırması"
      isLoading={isLoading}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'takim-performansi',
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Takım Fırsat Sayıları" subtitle="Kazanılan · Kaybedilen · Açık" delay={0.5}>
          <ReportBarChart
            data={oppCountsData}
            bars={[
              { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive },
              { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative },
              { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral },
            ]}
            height={300}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Takım Geliri" subtitle="Pipeline ve kazanılan gelir" delay={0.55}>
          <ReportBarChart
            data={revenueData}
            bars={[
              { dataKey: 'Pipeline', name: 'Pipeline', color: CHART_COLORS.neutral },
              { dataKey: 'Gelir', name: 'Gelir', color: CHART_COLORS.positive },
            ]}
            height={300}
            formatter={formatCurrency}
          />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Kazanma Oranları" subtitle="Takım bazlı %" delay={0.65}>
          <ReportBarChart
            data={winRateData}
            bars={[{ dataKey: 'Oran', name: 'Kazanma %', color: '#fbbf24' }]}
            height={280}
            showLegend={false}
            formatter={(val) => `%${Number(val).toFixed(1)}`}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Takım Sıralaması" subtitle="Toplam gelire göre" delay={0.7}>
          <Leaderboard items={leaderboardItems} maxItems={8} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Takım Detay Tablosu"
        badge={data ? `${data.tableData.length} takım` : undefined}
        delay={0.8}
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
