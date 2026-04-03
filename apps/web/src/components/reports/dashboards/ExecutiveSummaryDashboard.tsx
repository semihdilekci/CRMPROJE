'use client';

import { useState, useMemo } from 'react';
import { useExecutiveSummary } from '@/hooks/use-executive-summary';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, Leaderboard, ReportTable } from '@/components/reports';
import { ReportLineChart, ReportBarChart, ReportPieChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig, FilterOption } from '@/components/reports/ReportFilterBar';
import type { KpiItem, LeaderboardItem, ReportTableColumn } from '@crm/shared';

const PERIOD_OPTIONS: FilterOption[] = [
  { value: 'this_month', label: 'Bu Ay' },
  { value: 'this_quarter', label: 'Bu Çeyrek' },
  { value: 'this_year', label: 'Bu Yıl' },
];

const FILTERS: FilterConfig[] = [
  {
    key: 'period',
    label: 'Dönem',
    type: 'select',
    options: PERIOD_OPTIONS,
    placeholder: 'Tüm Zamanlar',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

/** API veya veri tutarsızlığında eksen etiketi için yedek (pipeline aşama dağılımı) */
const PIPELINE_STAGE_LABEL_FALLBACK: Record<string, string> = {
  tanisma: 'Tanışma',
  toplanti: 'Toplantı',
  teklif: 'Teklif',
  sozlesme: 'Sözleşme',
  satisa_donustu: 'Satışa Dönüştü',
  olumsuz: 'Olumsuz',
};

const WON_TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'value', label: 'Değer', sortable: true, align: 'right', format: 'currency' },
  { key: 'currency', label: 'Para Birimi', align: 'center' },
  { key: 'date', label: 'Tarih', sortable: true, align: 'right', format: 'date' },
];

function buildTrend(current: number, previous: number | undefined, isPercent = false) {
  if (previous === undefined || previous === null) return undefined;
  const diff = current - previous;
  if (diff === 0) return { value: 0, direction: 'neutral' as const, label: 'önceki dönem' };
  const direction = diff > 0 ? ('up' as const) : ('down' as const);
  const displayVal = isPercent
    ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pp`
    : diff > 0
      ? `+${diff.toLocaleString('tr-TR')}`
      : diff.toLocaleString('tr-TR');
  return { value: displayVal as unknown as number, direction, label: 'önceki dönem' };
}

export function ExecutiveSummaryDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const filters = useMemo(
    () => ({
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
      period: filterValues.period || undefined,
    }),
    [filterValues],
  );

  const { data, isLoading } = useExecutiveSummary(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'period' && value) {
        delete next.startDate;
        delete next.endDate;
      }
      if ((key === 'startDate' || key === 'endDate') && value) {
        delete next.period;
      }
      return next;
    });
  };

  const handleReset = () => setFilterValues({});

  const prev = data?.kpis.previousPeriod;

  const kpis: KpiItem[] = data
    ? [
        {
          label: 'Aktif Fuar',
          value: data.kpis.activeFairs,
          format: 'number',
          color: 'violet',
          icon: '🏛',
          trend: buildTrend(data.kpis.activeFairs, prev?.activeFairs),
        },
        {
          label: 'Açık Fırsat',
          value: data.kpis.openOpportunities,
          format: 'number',
          color: 'cyan',
          icon: '🔄',
          trend: buildTrend(data.kpis.openOpportunities, prev?.openOpportunities),
          sparkline: data.newOpportunitySparkline,
        },
        {
          label: 'Pipeline Değeri',
          value: data.kpis.pipelineValue,
          format: 'currency',
          color: 'orange',
          icon: '💰',
          trend: buildTrend(data.kpis.pipelineValue, prev?.pipelineValue),
        },
        {
          label: 'Kazanılan Gelir',
          value: data.kpis.wonRevenue,
          format: 'currency',
          color: 'green',
          icon: '✅',
          trend: buildTrend(data.kpis.wonRevenue, prev?.wonRevenue),
        },
        {
          label: 'Dönüşüm Oranı',
          value: data.kpis.conversionRate,
          format: 'percent',
          color: 'amber',
          icon: '📈',
          trend: buildTrend(data.kpis.conversionRate, prev?.conversionRate, true),
        },
        {
          label: 'Toplam Müşteri',
          value: data.kpis.totalCustomers,
          format: 'number',
          color: 'cyan',
          icon: '👥',
          trend: buildTrend(data.kpis.totalCustomers, prev?.totalCustomers),
        },
      ]
    : [];

  const stageBarData = useMemo(
    () =>
      (data?.pipelineStageDistribution ?? []).map((s) => {
        const label =
          s.label && String(s.label).trim() !== ''
            ? s.label
            : PIPELINE_STAGE_LABEL_FALLBACK[s.stage] ?? s.stage ?? 'Bilinmeyen';
        return {
          name: label,
          Adet: s.count,
          Değer: s.value,
        };
      }),
    [data],
  );

  const conversionPieData = useMemo(
    () =>
      (data?.conversionRateDistribution ?? [])
        .filter((c) => c.count > 0)
        .map((c, i) => ({
          name: c.label,
          value: c.count,
          color: Object.values(CHART_COLORS.conversion)[i],
        })),
    [data],
  );

  const topFairLeaderboard: LeaderboardItem[] = useMemo(
    () =>
      (data?.topFairs ?? []).map((f, i) => ({
        rank: i + 1,
        label: f.name,
        value: f.openOpportunities,
        secondary: 'açık fırsat',
      })),
    [data],
  );

  const topCustomerLeaderboard: LeaderboardItem[] = useMemo(
    () =>
      (data?.topCustomers ?? []).map((c, i) => ({
        rank: i + 1,
        label: c.company,
        sublabel: c.name,
        value:
          c.totalValue >= 1_000_000
            ? `₺${(c.totalValue / 1_000_000).toFixed(1)}M`
            : `₺${(c.totalValue / 1_000).toFixed(0)}K`,
        secondary: `${c.opportunityCount} fırsat`,
        avatarInitials: c.company.substring(0, 2).toUpperCase(),
      })),
    [data],
  );

  const revenueChartData = useMemo(
    () =>
      (data?.monthlyRevenueTrend ?? []).map((m) => ({
        name: m.month,
        Gelir: m.value,
      })),
    [data],
  );

  const formatCurrency = (val: unknown) => {
    const n = Number(val);
    if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
    return `₺${n.toLocaleString('tr-TR')}`;
  };

  return (
    <ReportDashboardLayout
      title="Genel Durum Dashboard'u"
      subtitle="Satış operasyonunun anlık fotoğrafı — KPI'lar, trendler ve öne çıkan metrikler"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      filterBar={
        <ReportFilterBar
          filters={FILTERS}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      }
      csvExportConfig={{
        rows: data?.recentWonOpportunities ?? [],
        columns: WON_TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'yonetici-ozeti',
      }}
    >
      {/* KPI Cards — 6 cards in 2 rows of 3 on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {/* Charts Row 1: Revenue Trend + Pipeline Stage */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard
          title="Aylık Kazanılan Gelir Trendi"
          subtitle="Son 12 ay"
          delay={0.6}
        >
          <ReportLineChart
            data={revenueChartData}
            lines={[{ dataKey: 'Gelir', name: 'Kazanılan Gelir', color: CHART_COLORS.positive }]}
            height={280}
            showLegend={false}
            formatter={formatCurrency}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title="Pipeline Aşama Dağılımı"
          subtitle="Her aşamadaki fırsat sayısı"
          delay={0.7}
        >
          <ReportBarChart
            data={stageBarData}
            bars={[{ dataKey: 'Adet', name: 'Fırsat Sayısı', color: CHART_COLORS.neutral }]}
            layout="horizontal"
            height={280}
            showLegend={false}
          />
        </AnalyticsCard>
      </div>

      {/* Charts Row 2: Conversion Rate Pie + Leaderboards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard
          title="Dönüşüm Oranı Dağılımı"
          subtitle="Fırsatların conversionRate dağılımı"
          delay={0.8}
        >
          <ReportPieChart
            data={conversionPieData}
            height={260}
            innerRadius={50}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title="En Aktif 5 Fuar"
          subtitle="Açık fırsat sayısına göre"
          delay={0.9}
        >
          <Leaderboard items={topFairLeaderboard} />
        </AnalyticsCard>

        <AnalyticsCard
          title="En Değerli 5 Müşteri"
          subtitle="Toplam bütçe değerine göre"
          delay={1.0}
        >
          <Leaderboard items={topCustomerLeaderboard} />
        </AnalyticsCard>
      </div>

      {/* Won Opportunities Table */}
      <AnalyticsCard
        title="Son Kazanılan Fırsatlar"
        subtitle="Son 10 satışa dönüşen fırsat"
        badge={data ? `${data.recentWonOpportunities.length} kayıt` : undefined}
        delay={1.1}
      >
        <ReportTable
          columns={WON_TABLE_COLUMNS}
          rows={data?.recentWonOpportunities ?? []}
          defaultSortBy="date"
          defaultSortOrder="desc"
          maxRows={10}
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
