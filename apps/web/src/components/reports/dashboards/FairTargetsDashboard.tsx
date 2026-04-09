'use client';

import { useState, useMemo } from 'react';
import { useFairTargets } from '@/hooks/use-fair-reports';
import { ReportDashboardLayout, KpiCard, ReportFilterBar, ReportTable, ProgressBarGroup } from '@/components/reports';
import { ReportGauge, ReportBarChart } from '@/components/reports/charts';
import { AnalyticsCard } from '@/components/reports/AnalyticsCard';
import type { FilterConfig } from '@/components/reports/ReportFilterBar';
import type { FairTargetsResponse, KpiItem, ProgressBarItem, ReportTableColumn } from '@crm/shared';

const TARGET_CATEGORY_KEYS = ['budget', 'tonnage', 'lead'] as const;
type TargetCategoryKey = (typeof TARGET_CATEGORY_KEYS)[number];

function parseTargetCategories(raw: string | undefined): Set<TargetCategoryKey> {
  if (!raw?.trim()) return new Set(TARGET_CATEGORY_KEYS);
  const parts = raw.split(',').filter((v): v is TargetCategoryKey =>
    (TARGET_CATEGORY_KEYS as readonly string[]).includes(v),
  );
  const s = new Set(parts);
  if (s.size === 0) return new Set(TARGET_CATEGORY_KEYS);
  return s;
}

const FILTERS: FilterConfig[] = [
  {
    key: 'targetCategories',
    label: 'Hedef kategorisi',
    type: 'multi-select',
    options: [
      { value: 'budget', label: 'Bütçe Hedefi' },
      { value: 'tonnage', label: 'Tonaj Hedefi' },
      { value: 'lead', label: 'Fırsat Hedefi' },
    ],
  },
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

const TABLE_COLUMNS_FULL: ReportTableColumn[] = [
  { key: 'fairName', label: 'Fuar', sortable: true },
  { key: 'budgetTarget', label: 'Bütçe Hedef', sortable: true, align: 'right', format: 'currency' },
  { key: 'budgetActual', label: 'Bütçe Gerçek', sortable: true, align: 'right', format: 'currency' },
  { key: 'budgetPercent', label: 'Bütçe %', sortable: true, align: 'right', format: 'percent' },
  { key: 'tonnageTarget', label: 'Tonaj Hedef', sortable: true, align: 'right', format: 'number' },
  { key: 'tonnageActual', label: 'Tonaj Gerçek', sortable: true, align: 'right', format: 'number' },
  { key: 'tonnagePercent', label: 'Tonaj %', sortable: true, align: 'right', format: 'percent' },
  { key: 'leadTarget', label: 'Fırsat Hedef', sortable: true, align: 'right', format: 'number' },
  { key: 'leadActual', label: 'Fırsat Gerçek', sortable: true, align: 'right', format: 'number' },
  { key: 'leadPercent', label: 'Fırsat %', sortable: true, align: 'right', format: 'percent' },
];

const formatCurrency = (val: unknown) => {
  const n = Number(val);
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}K`;
  return `₺${n.toLocaleString('tr-TR')}`;
};

function avgCompletionForCategories(
  rows: NonNullable<FairTargetsResponse['allFairTargets']>,
  cats: Set<TargetCategoryKey>,
): number {
  if (rows.length === 0 || cats.size === 0) return 0;
  const sumRow = (f: (typeof rows)[0]) => {
    let s = 0;
    let n = 0;
    if (cats.has('budget')) {
      s += f.budgetPercent;
      n += 1;
    }
    if (cats.has('tonnage')) {
      s += f.tonnagePercent;
      n += 1;
    }
    if (cats.has('lead')) {
      s += f.leadPercent;
      n += 1;
    }
    return n ? s / n : 0;
  };
  const total = rows.reduce((acc, f) => acc + sumRow(f), 0);
  return Math.round((total / rows.length) * 100) / 100;
}

export function FairTargetsDashboard() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data, isLoading } = useFairTargets({ status: filterValues.status || undefined });

  const handleFilterChange = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilterValues({});

  const targetCats = useMemo(
    () => parseTargetCategories(filterValues.targetCategories),
    [filterValues.targetCategories],
  );
  const comparisonSubtitle = [
    targetCats.has('budget') ? 'Bütçe' : null,
    targetCats.has('tonnage') ? 'Tonaj' : null,
    targetCats.has('lead') ? 'Fırsat' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const tableColumns = useMemo(() => {
    const rest = TABLE_COLUMNS_FULL.slice(1).filter((col) => {
      if (col.key.startsWith('budget')) return targetCats.has('budget');
      if (col.key.startsWith('tonnage')) return targetCats.has('tonnage');
      if (col.key.startsWith('lead')) return targetCats.has('lead');
      return true;
    });
    return [TABLE_COLUMNS_FULL[0], ...rest];
  }, [targetCats]);

  const topFair = data?.allFairTargets?.[0];

  const filteredAvgCompletion = useMemo(
    () => (data?.allFairTargets ? avgCompletionForCategories(data.allFairTargets, targetCats) : 0),
    [data?.allFairTargets, targetCats],
  );

  const avgKpi: KpiItem[] = data
    ? [
        {
          label: 'Ort. Hedef Gerçekleşme',
          value: filteredAvgCompletion,
          format: 'percent',
          color:
            filteredAvgCompletion >= 80 ? 'green' : filteredAvgCompletion >= 50 ? 'amber' : 'red',
          icon: '🎯',
        },
      ]
    : [];

  const progressItems: ProgressBarItem[] = useMemo(() => {
    const rows = data?.allFairTargets ?? [];
    return rows.flatMap((f) => {
      const items: ProgressBarItem[] = [];
      if (targetCats.has('budget')) {
        items.push({
          label: `${f.fairName} — Bütçe`,
          value: f.budgetActual,
          max: f.budgetTarget,
          sublabel: `${formatCurrency(f.budgetActual)} / ${formatCurrency(f.budgetTarget)}`,
        });
      }
      if (targetCats.has('tonnage')) {
        const tonTgt = f.tonnageTarget ?? 0;
        items.push({
          label: `${f.fairName} — Tonaj`,
          value: f.tonnageActual,
          max: tonTgt,
          sublabel: `${f.tonnageActual.toFixed(1)} / ${tonTgt.toFixed(1)} ton`,
        });
      }
      if (targetCats.has('lead')) {
        const leadTgt = f.leadTarget ?? 0;
        items.push({
          label: `${f.fairName} — Fırsat`,
          value: f.leadActual,
          max: leadTgt,
          sublabel: `${f.leadActual} / ${leadTgt} fırsat`,
        });
      }
      return items;
    });
  }, [data?.allFairTargets, targetCats]);

  const budgetBarData = useMemo(
    () =>
      (data?.allFairTargets ?? []).map((f) => ({
        name: f.fairName,
        Hedef: f.budgetTarget,
        Gerçekleşen: f.budgetActual,
      })),
    [data?.allFairTargets],
  );

  const tonnageBarData = useMemo(
    () =>
      (data?.allFairTargets ?? []).map((f) => ({
        name: f.fairName,
        Hedef: f.tonnageTarget,
        Gerçekleşen: f.tonnageActual,
      })),
    [data?.allFairTargets],
  );

  const defaultSortBy = useMemo(() => {
    if (targetCats.has('budget')) return 'budgetPercent';
    if (targetCats.has('tonnage')) return 'tonnagePercent';
    if (targetCats.has('lead')) return 'leadPercent';
    return 'fairName';
  }, [targetCats]);

  return (
    <ReportDashboardLayout
      title="Fuar Hedef Takibi"
      subtitle="Bütçe, tonaj ve lead hedeflerinin gerçekleşme durumu"
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
        rows: data?.allFairTargets ?? [],
        columns: tableColumns.map((c) => ({
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
        {topFair && targetCats.has('budget') && (
          <div
            className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
            style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.3s forwards' }}
          >
            <ReportGauge
              value={topFair.budgetPercent}
              valueIsPercent
              label="Bütçe"
              sublabel={topFair.fairName}
              size={140}
            />
          </div>
        )}
        {topFair && targetCats.has('tonnage') && (
          <div
            className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
            style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.4s forwards' }}
          >
            <ReportGauge
              value={topFair.tonnagePercent}
              valueIsPercent
              label="Tonaj"
              sublabel={topFair.fairName}
              size={140}
              color="#06b6d4"
            />
          </div>
        )}
        {topFair && targetCats.has('lead') && (
          <div
            className="flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-xl"
            style={{ opacity: 0, animation: 'fadeUp 0.5s ease 0.5s forwards' }}
          >
            <ReportGauge
              value={topFair.leadPercent}
              valueIsPercent
              label="Fırsat"
              sublabel={topFair.fairName}
              size={140}
              color="#fbbf24"
            />
          </div>
        )}
      </div>

      {/* Progress bars */}
      <AnalyticsCard
        title="Tüm Fuarlar Hedef Karşılaştırma"
        subtitle={comparisonSubtitle || '—'}
        delay={0.6}
      >
        <ProgressBarGroup items={progressItems} />
      </AnalyticsCard>

      {(targetCats.has('budget') || targetCats.has('tonnage')) && (
        <div
          className={`grid grid-cols-1 gap-4 ${targetCats.has('budget') && targetCats.has('tonnage') ? 'md:grid-cols-2' : ''}`}
        >
          {targetCats.has('budget') && (
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
          )}
          {targetCats.has('tonnage') && (
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
          )}
        </div>
      )}

      {/* Table */}
      <AnalyticsCard
        title="Hedef Detay Tablosu"
        badge={data ? `${data.allFairTargets.length} fuar` : undefined}
        delay={0.9}
      >
        <ReportTable
          columns={tableColumns}
          rows={data?.allFairTargets ?? []}
          defaultSortBy={defaultSortBy}
          defaultSortOrder="desc"
        />
      </AnalyticsCard>
    </ReportDashboardLayout>
  );
}
