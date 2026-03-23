'use client';

import { useState, useMemo } from 'react';
import { useWinLoss } from '@/hooks/use-pipeline-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable } from '@/components/reports';
import { ReportBarChart, ReportLineChart, ReportPieChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
  {
    key: 'conversionRate', label: 'Dönüşüm Oranı', type: 'select',
    options: [
      { value: 'very_high', label: 'Çok Yüksek' }, { value: 'high', label: 'Yüksek' },
      { value: 'medium', label: 'Orta' }, { value: 'low', label: 'Düşük' }, { value: 'very_low', label: 'Çok Düşük' },
    ], placeholder: 'Tümü',
  },
];

const LOST_TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'value', label: 'Değer', sortable: true, align: 'right', format: 'currency' },
  { key: 'lossReason', label: 'Kayıp Nedeni', sortable: true },
  { key: 'lastStage', label: 'Son Aşama', sortable: true },
  { key: 'date', label: 'Tarih', sortable: true, align: 'right', format: 'date' },
];

const WON_TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'value', label: 'Değer', sortable: true, align: 'right', format: 'currency' },
  { key: 'cycleDays', label: 'Döngü (gün)', sortable: true, align: 'right', format: 'number' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function WinLossDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useWinLoss(filterValues);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Kazanma Oranı', value: data.kpis.winRate, format: 'percent', color: 'green', icon: '🏆' },
        { label: 'Kazanılan', value: data.kpis.wonCount, format: 'number', color: 'green', icon: '✅' },
        { label: 'Kaybedilen', value: data.kpis.lostCount, format: 'number', color: 'red', icon: '❌' },
        { label: 'Kaybedilen Değer', value: data.kpis.lostValue, format: 'currency', color: 'red', icon: '💸' },
      ]
    : [];

  const donutData = useMemo(
    () =>
      data
        ? [
            { name: 'Kazanılan', value: data.winLossDonut.won, color: CHART_COLORS.positive },
            { name: 'Kaybedilen', value: data.winLossDonut.lost, color: CHART_COLORS.negative },
          ]
        : [],
    [data],
  );

  const lossReasonBarData = useMemo(
    () => (data?.lossReasons ?? []).map((r) => ({ name: r.label, Adet: r.count })),
    [data],
  );

  const trendData = useMemo(
    () => (data?.monthlyWinRateTrend ?? []).map((m) => ({ name: m.month, Oran: m.winRate })),
    [data],
  );

  const fairBarData = useMemo(
    () =>
      (data?.fairWinLoss ?? []).map((f) => ({
        name: f.fairName,
        Kazanılan: f.won,
        Kaybedilen: f.lost,
        Açık: f.open,
      })),
    [data],
  );

  const conversionBarData = useMemo(
    () => (data?.conversionRateSuccess ?? []).map((c) => ({ name: c.label, Oran: c.winRate })),
    [data],
  );

  const lostValuePieData = useMemo(
    () =>
      (data?.lostValueByReason ?? []).filter((r) => r.value > 0).map((r, i) => ({
        name: r.label,
        value: r.value,
        color: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Kazanma / Kaybetme Analizi"
      subtitle="Neden kazanıyoruz, neden kaybediyoruz? Kayıp nedenleri detayı"
      isLoading={isLoading}
      filterBar={<ReportFilterBar filters={FILTERS} values={filterValues} onChange={handleFilterChange} onReset={handleReset} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => <KpiCard key={kpi.label} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AnalyticsCard title="Kazanma / Kayıp Oranı" delay={0.5}>
          <ReportPieChart data={donutData} height={240} innerRadius={55} showLabel={false} />
        </AnalyticsCard>
        <AnalyticsCard title="Kayıp Nedenleri" subtitle="Sayı bazlı" delay={0.6}>
          <ReportBarChart data={lossReasonBarData} bars={[{ dataKey: 'Adet', name: 'Sayı', color: CHART_COLORS.negative }]} layout="vertical" height={240} showLegend={false} />
        </AnalyticsCard>
        <AnalyticsCard title="Kayıp Değer Dağılımı" subtitle="Nedene göre" delay={0.7}>
          <ReportPieChart data={lostValuePieData} height={240} innerRadius={45} formatter={formatCurrency} />
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Aylık Kazanma Oranı Trendi" subtitle="Son 12 ay" delay={0.8}>
          <ReportLineChart data={trendData} lines={[{ dataKey: 'Oran', name: 'Kazanma %', color: CHART_COLORS.positive }]} height={260} showLegend={false} formatter={(val) => `%${Number(val).toFixed(1)}`} />
        </AnalyticsCard>
        <AnalyticsCard title="Dönüşüm Oranına Göre Başarı" subtitle="Tahminlerimiz ne kadar doğru?" delay={0.9}>
          <ReportBarChart data={conversionBarData} bars={[{ dataKey: 'Oran', name: 'Kazanma %', color: '#fbbf24' }]} height={260} showLegend={false} formatter={(val) => `%${Number(val).toFixed(1)}`} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard title="Fuar Bazlı Kazanma / Kayıp" delay={1.0}>
        <ReportBarChart
          data={fairBarData}
          bars={[
            { dataKey: 'Kazanılan', name: 'Kazanılan', color: CHART_COLORS.positive, stackId: 'a' },
            { dataKey: 'Kaybedilen', name: 'Kaybedilen', color: CHART_COLORS.negative, stackId: 'a' },
            { dataKey: 'Açık', name: 'Açık', color: CHART_COLORS.neutral, stackId: 'a' },
          ]}
          height={280}
        />
      </AnalyticsCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Kaybedilen Fırsatlar" badge={data ? `${data.lostOpportunities.length}` : undefined} delay={1.1}>
          <ReportTable columns={LOST_TABLE_COLUMNS} rows={data?.lostOpportunities ?? []} defaultSortBy="value" defaultSortOrder="desc" maxRows={15} />
        </AnalyticsCard>
        <AnalyticsCard title="Kazanılan Fırsatlar" badge={data ? `${data.wonOpportunities.length}` : undefined} delay={1.2}>
          <ReportTable columns={WON_TABLE_COLUMNS} rows={data?.wonOpportunities ?? []} defaultSortBy="value" defaultSortOrder="desc" maxRows={15} />
        </AnalyticsCard>
      </div>
    </ReportDashboardLayout>
  );
}
