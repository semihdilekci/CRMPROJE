'use client';

import { useMemo, useState } from 'react';
import { useCustomerLifecycle } from '@/hooks/use-customer-reports';
import {
  ReportDashboardLayout,
  KpiCard,
  ReportFilterBar,
  ReportTable,
  Leaderboard,
  type FilterConfig,
} from '@/components/reports';
import { ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import { CHART_COLORS } from '@/components/reports/charts/chart-theme';
import type { KpiItem, LeaderboardItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Durum',
    type: 'select',
    options: [
      { value: 'active', label: 'Aktif' },
      { value: 'past', label: 'Geçmiş' },
    ],
    placeholder: 'Tümü',
  },
  { key: 'startDate', label: 'Başlangıç', type: 'date' },
  { key: 'endDate', label: 'Bitiş', type: 'date' },
];

const INACTIVE_TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'company', label: 'Şirket', sortable: true },
  { key: 'name', label: 'Yetkili', sortable: true },
  {
    key: 'daysSinceLastActivity',
    label: 'Son Aktivite (gün)',
    sortable: true,
    align: 'right',
    format: 'number',
  },
  {
    key: 'openOpportunities',
    label: 'Açık Fırsat',
    sortable: true,
    align: 'right',
    format: 'number',
  },
  { key: 'value', label: 'Değer', sortable: true, align: 'right', format: 'currency' },
];

const formatCurrency = (n: number) => {
  if (Number.isNaN(n)) return '₺0';
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function CustomerLifecycleDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useCustomerLifecycle({
    status: filterValues.status || undefined,
    startDate: filterValues.startDate || undefined,
    endDate: filterValues.endDate || undefined,
  });

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const kpis: KpiItem[] = data
    ? [
        { label: 'Tekrarlayan Müşteri', value: data.kpis.repeatCustomers, format: 'number', color: 'violet', icon: '🔁' },
        {
          label: 'Tekrar Oranı',
          value: data.kpis.repeatCustomerRate,
          format: 'percent',
          color: 'cyan',
          icon: '📊',
        },
        { label: 'Pasif Müşteri', value: data.kpis.inactiveCustomers, format: 'number', color: 'orange', icon: '⏸' },
        {
          label: 'Ort. Müşteri Ömrü (gün)',
          value: data.kpis.avgCustomerLifetimeDays,
          format: 'number',
          color: 'amber',
          icon: '📅',
        },
      ]
    : [];

  const fairFreqData = useMemo(
    () =>
      (data?.fairParticipationFrequency ?? []).map((f) => ({
        name: `${f.fairCount} fuar`,
        Müşteri: f.customerCount,
      })),
    [data],
  );

  const loyalItems: LeaderboardItem[] = useMemo(
    () =>
      (data?.loyalCustomers ?? []).map((c, i) => ({
        rank: i + 1,
        label: c.company,
        sublabel: `${c.fairCount} fuar · ${c.opportunityCount} fırsat`,
        value: formatCurrency(c.totalValue),
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Müşteri Yaşam Döngüsü"
      subtitle="Sadakat, fuar katılımı ve pasif müşteriler"
      isLoading={isLoading}
      isEmpty={!isLoading && !data}
      csvExportConfig={{
        rows: (data?.inactiveCustomerTable ?? []) as Record<string, unknown>[],
        columns: INACTIVE_TABLE_COLUMNS.map((c) =>
          c.format === 'number' || c.format === 'currency' || c.format === 'percent' || c.format === 'date'
            ? { key: c.key, label: c.label, format: c.format }
            : { key: c.key, label: c.label },
        ),
        filename: 'musteri-yasam-dongusu-pasif',
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalyticsCard title="Fuar Katılım Frekansı" subtitle="Kaç fuarda yer alan kaç müşteri" delay={0.5}>
          <ReportBarChart
            data={fairFreqData}
            bars={[{ dataKey: 'Müşteri', name: 'Müşteri', color: CHART_COLORS.positive }]}
            height={300}
            showLegend={false}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title="Sadık Müşteriler"
          subtitle="Fuar ve fırsat yoğunluğuna göre"
          badge={data ? `${loyalItems.length} müşteri` : undefined}
          delay={0.55}
        >
          <Leaderboard items={loyalItems} maxItems={10} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Pasif Müşteriler"
        subtitle="Son aktivitesi uzun süre önce olan kayıtlar"
        badge={data ? `${data.inactiveCustomerTable.length} kayıt` : undefined}
        delay={0.65}
      >
        <ReportTable
          columns={INACTIVE_TABLE_COLUMNS}
          rows={data?.inactiveCustomerTable ?? []}
          defaultSortBy="daysSinceLastActivity"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
