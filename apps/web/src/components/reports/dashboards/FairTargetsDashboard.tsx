'use client';

import { useState, useMemo } from 'react';
import { useFairTargets } from '@/hooks/use-fair-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable, ProgressBarGroup } from '@/components/reports';
import { ReportGauge, ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { KpiItem, ProgressBarItem, ReportTableColumn } from '@crm/shared';

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Fuar Durumu',
    type: 'select',
    options: [
      { value: 'active', label: 'Aktif' },
      { value: 'past', label: 'Geçmiş' },
    ],
    placeholder: 'Tümü',
  },
];

const TABLE_COLUMNS: ReportTableColumn[] = [
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'budgetTarget', label: 'Bütçe Hedef', sortable: true, align: 'right', format: 'currency' },
  { key: 'budgetActual', label: 'Bütçe Gerçek', sortable: true, align: 'right', format: 'currency' },
  { key: 'budgetPercent', label: 'Bütçe %', sortable: true, align: 'right', format: 'percent' },
  { key: 'tonnageTarget', label: 'Tonaj Hedef', sortable: true, align: 'right', format: 'number' },
  { key: 'tonnageActual', label: 'Tonaj Gerçek', sortable: true, align: 'right', format: 'number' },
  { key: 'tonnagePercent', label: 'Tonaj %', sortable: true, align: 'right', format: 'percent' },
  { key: 'leadTarget', label: 'Lead Hedef', sortable: true, align: 'right', format: 'number' },
  { key: 'leadActual', label: 'Lead Gerçek', sortable: true, align: 'right', format: 'number' },
  { key: 'leadPercent', label: 'Lead %', sortable: true, align: 'right', format: 'percent' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

export function FairTargetsDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useFairTargets({ status: filterValues.status || undefined });

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const topFair = data?.allFairTargets?.[0];

  const avgKpi: KpiItem[] = data
    ? [
        {
          label: 'Ort. Hedef Gerçekleşme',
          value: data.avgTargetCompletion,
          format: 'percent',
          color: data.avgTargetCompletion >= 80 ? 'green' : data.avgTargetCompletion >= 50 ? 'amber' : 'red',
          icon: '🎯',
        },
      ]
    : [];

  const progressItems: ProgressBarItem[] = useMemo(
    () =>
      (data?.allFairTargets ?? []).flatMap((f) => [
        {
          label: `${f.fairName} — Bütçe`,
          value: f.budgetActual,
          max: f.budgetTarget || 1,
          sublabel: `${formatCurrency(f.budgetActual)} / ${formatCurrency(f.budgetTarget)}`,
        },
        {
          label: `${f.fairName} — Tonaj`,
          value: f.tonnageActual,
          max: f.tonnageTarget || 1,
          sublabel: `${f.tonnageActual.toFixed(1)} / ${f.tonnageTarget.toFixed(1)} ton`,
        },
        {
          label: `${f.fairName} — Lead`,
          value: f.leadActual,
          max: f.leadTarget || 1,
          sublabel: `${f.leadActual} / ${f.leadTarget} lead`,
        },
      ]),
    [data],
  );

  const budgetBarData = useMemo(
    () =>
      (data?.allFairTargets ?? []).map((f) => ({
        name: f.fairName,
        Hedef: f.budgetTarget,
        Gerçekleşen: f.budgetActual,
      })),
    [data],
  );

  const tonnageBarData = useMemo(
    () =>
      (data?.allFairTargets ?? []).map((f) => ({
        name: f.fairName,
        Hedef: f.tonnageTarget,
        Gerçekleşen: f.tonnageActual,
      })),
    [data],
  );

  return (
    <ReportDashboardLayout
      title="Fuar Hedef Takibi"
      subtitle="Bütçe, tonaj ve lead hedeflerinin gerçekleşme durumu"
      isLoading={isLoading}
      filterBar={
        <ReportFilterBar
          filters={FILTERS}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      }
      csvExportConfig={{
        rows: data?.allFairTargets ?? [],
        columns: TABLE_COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          ...(c.format && c.format !== 'text' ? { format: c.format } : {}),
        })),
        filename: 'fuar-hedefler',
      }}
    >
      {/* KPI + Gauges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {avgKpi.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
        {topFair && (
          <>
            <div
              className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
              style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.3s forwards' }}
            >
              <ReportGauge
                value={topFair.budgetPercent}
                label="Bütçe"
                sublabel={topFair.fairName}
                size={140}
              />
            </div>
            <div
              className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
              style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.4s forwards' }}
            >
              <ReportGauge
                value={topFair.tonnagePercent}
                label="Tonaj"
                sublabel={topFair.fairName}
                size={140}
                color="#06b6d4"
              />
            </div>
            <div
              className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
              style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.5s forwards' }}
            >
              <ReportGauge
                value={topFair.leadPercent}
                label="Lead"
                sublabel={topFair.fairName}
                size={140}
                color="#fbbf24"
              />
            </div>
          </>
        )}
      </div>

      {/* Progress bars */}
      <AnalyticsCard title="Tüm Fuarlar Hedef Karşılaştırma" subtitle="Bütçe, tonaj ve lead" delay={0.6}>
        <ProgressBarGroup items={progressItems} />
      </AnalyticsCard>

      {/* Budget and Tonnage bar charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Hedef vs Gerçekleşen Bütçe" delay={0.7}>
          <ReportBarChart
            data={budgetBarData}
            bars={[
              { dataKey: 'Hedef', name: 'Hedef', color: 'rgba(139,92,246,0.4)' },
              { dataKey: 'Gerçekleşen', name: 'Gerçekleşen', color: '#4ade80' },
            ]}
            height={280}
            formatter={formatCurrency}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Hedef vs Gerçekleşen Tonaj" delay={0.8}>
          <ReportBarChart
            data={tonnageBarData}
            bars={[
              { dataKey: 'Hedef', name: 'Hedef', color: 'rgba(6,182,212,0.4)' },
              { dataKey: 'Gerçekleşen', name: 'Gerçekleşen', color: '#06b6d4' },
            ]}
            height={280}
          />
        </AnalyticsCard>
      </div>

      {/* Table */}
      <AnalyticsCard
        title="Hedef Detay Tablosu"
        badge={data ? `${data.allFairTargets.length} fuar` : undefined}
        delay={0.9}
      >
        <ReportTable
          columns={TABLE_COLUMNS}
          rows={data?.allFairTargets ?? []}
          defaultSortBy="budgetPercent"
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
