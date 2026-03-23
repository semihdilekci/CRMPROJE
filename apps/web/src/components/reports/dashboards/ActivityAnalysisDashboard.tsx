'use client';

import { useState, useMemo } from 'react';
import { useActivityAnalysis } from '@/hooks/use-team-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable, ActivityFeed } from '@/components/reports';
import { ReportLineChart, ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'date', label: 'Tarih', sortable: true, align: 'right', format: 'date' },
  { key: 'userName', label: 'Kullanıcı', sortable: true },
  { key: 'activityType', label: 'Aktivite Tipi', sortable: true },
  { key: 'customerCompany', label: 'Müşteri', sortable: true },
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'detail', label: 'Detay', sortable: false },
];

export function ActivityAnalysisDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const filters = useMemo(
    () => ({
      startDate: filterValues.startDate || undefined,
      endDate: filterValues.endDate || undefined,
    }),
    [filterValues],
  );
  const { data, isLoading } = useActivityAnalysis(filters);

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Toplam Aktivite', value: data.kpis.totalActivities, format: 'number', color: 'violet', icon: '📋' },
        { label: 'Günlük Ortalama', value: data.kpis.dailyAvg, format: 'number', color: 'cyan', icon: '📅' },
        {
          label: 'En Aktif Kullanıcı',
          value: `${data.kpis.mostActiveUser.name} (${data.kpis.mostActiveUser.count})`,
          format: 'text',
          color: 'amber',
          icon: '🔥',
        },
      ]
    : [];

  const trendData = useMemo(
    () =>
      (data?.dailyActivityTrend ?? []).map((d) => ({
        name: d.date,
        Aktivite: d.count,
      })),
    [data],
  );

  const userActivityData = useMemo(
    () =>
      (data?.userActivityCounts ?? []).map((u) => ({
        name: u.name,
        Aktivite: u.count,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Aktivite Analizi"
      subtitle="Sistem aktiviteleri, trend ve kullanıcı dağılımı"
      isLoading={isLoading}
      csvExportConfig={{
        rows: (data?.tableData ?? []) as Record<string, unknown>[],
        columns: TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'aktivite-analizi',
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Günlük Aktivite Trendi" subtitle="Seçilen dönem" delay={0.5}>
          <ReportLineChart
            data={trendData}
            lines={[{ dataKey: 'Aktivite', name: 'Aktivite', color: CHART_COLORS.gradient.cyan[0] }]}
            height={280}
            showLegend={false}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Kullanıcı Bazlı Aktivite" subtitle="Toplam aktivite adedi" delay={0.55}>
          <ReportBarChart
            data={userActivityData}
            bars={[{ dataKey: 'Aktivite', name: 'Aktivite', color: CHART_COLORS.gradient.violet[0] }]}
            layout="vertical"
            height={280}
            showLegend={false}
          />
        </AnalyticsCard>
      </div>

      <AnalyticsCard title="Son Aktiviteler" subtitle="En güncel kayıtlar" delay={0.65}>
        <ActivityFeed items={data?.recentActivities ?? []} maxItems={12} />
      </AnalyticsCard>

      <AnalyticsCard
        title="Aktivite Günlüğü"
        badge={data ? `${data.tableData.length} kayıt` : undefined}
        delay={0.75}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.tableData ?? []}
          defaultSortBy="date"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
