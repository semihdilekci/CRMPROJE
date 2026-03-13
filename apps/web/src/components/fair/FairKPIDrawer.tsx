'use client';

import { useState, useCallback } from 'react';
import { useFairMetrics } from '@/hooks/use-fair-metrics';
import { formatBudget, parseBudgetToNumber } from '@crm/shared';

interface FairKPIDrawerProps {
  fairId: string;
  targets: {
    targetBudget: string | null;
    targetTonnage: number | null;
    targetLeadCount: number | null;
  };
  onEditFair?: () => void;
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#4ADE80';
  if (pct >= 80) return '#4ADE80';
  if (pct >= 50) return '#FFB347';
  return '#F87171';
}

function ProgressCard({
  title,
  current,
  target,
  targetLabel,
  progress,
  formatValue,
}: {
  title: string;
  current: number;
  target: number | null;
  targetLabel: string;
  progress: number | null;
  formatValue: (v: number) => string;
}) {
  if (target == null || target <= 0) {
    return null;
  }

  const pct = progress ?? 0;
  const color = getProgressColor(pct);
  const isExceeded = pct >= 100;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl p-4">
      <span className="text-[12px] font-medium uppercase tracking-wider text-white/60">
        {title}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[22px] font-extrabold text-white">
          {formatValue(current)} / {formatValue(target)} {targetLabel}
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
          style={{ backgroundColor: `${color}30`, color }}
        >
          %{pct.toFixed(0)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {isExceeded && (
        <span className="text-[12px] font-medium" style={{ color: '#4ADE80' }}>
          🎯 Hedef Aşıldı!
        </span>
      )}
    </div>
  );
}

function NoTargetCard({ title, onEdit }: { title: string; onEdit?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
      <span className="text-[12px] font-medium uppercase tracking-wider text-white/60">
        {title}
      </span>
      <p className="text-[14px] text-white/60">Hedef belirlenmemiş</p>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-1 self-start text-[13px] font-medium text-violet-400 hover:text-violet-300"
        >
          Fuarı düzenleyerek hedef ekleyin
        </button>
      )}
    </div>
  );
}

export function FairKPIDrawer({
  fairId,
  targets,
  onEditFair,
}: FairKPIDrawerProps) {
  const [open, setOpen] = useState(false);
  const { data: metrics, isLoading } = useFairMetrics(fairId);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const hasTargetLead = targets.targetLeadCount != null && targets.targetLeadCount > 0;
  const hasTargetTonnage = targets.targetTonnage != null && targets.targetTonnage > 0;
  const targetBudgetNum = parseBudgetToNumber(targets.targetBudget);
  const hasTargetBudget = targetBudgetNum > 0;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-xl transition-all hover:border-white/30"
      >
        <span className="text-[14px] font-medium text-white">
          📊 Hedefler & Metrikler
        </span>
        <svg
          className="h-5 w-5 text-white/60 transition-transform duration-300 ease-out"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? 1200 : 0 }}
      >
        <div
          className="pt-4 transition-opacity duration-200"
          style={{ opacity: open ? 1 : 0, transitionDelay: open ? '0.1s' : '0s' }}
        >
          {isLoading ? (
            <p className="py-8 text-center text-white/60">Yükleniyor...</p>
          ) : metrics ? (
            <div className="flex flex-col gap-4">
              {/* Hedef progress kartları */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {hasTargetLead ? (
                  <ProgressCard
                    title="Fırsat Hedefi"
                    current={metrics.totalOpportunities}
                    target={targets.targetLeadCount}
                    targetLabel=""
                    progress={metrics.targetLeadCountProgress}
                    formatValue={(v) => String(Math.round(v))}
                  />
                ) : (
                  <NoTargetCard title="Fırsat Hedefi" onEdit={onEditFair} />
                )}
                {hasTargetTonnage ? (
                  <ProgressCard
                    title="Tonaj Hedefi"
                    current={metrics.wonTonnage}
                    target={targets.targetTonnage}
                    targetLabel="ton"
                    progress={metrics.targetTonnageProgress}
                    formatValue={(v) => v.toLocaleString('tr-TR')}
                  />
                ) : (
                  <NoTargetCard title="Tonaj Hedefi" onEdit={onEditFair} />
                )}
                {hasTargetBudget ? (
                  <ProgressCard
                    title="Bütçe Hedefi"
                    current={metrics.wonPipelineValue}
                    target={targetBudgetNum}
                    targetLabel=""
                    progress={metrics.targetBudgetProgress}
                    formatValue={(v) => formatBudget(String(v))}
                  />
                ) : (
                  <NoTargetCard title="Bütçe Hedefi" onEdit={onEditFair} />
                )}
              </div>

              {/* Ek metrik kartları */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                <MetricCard
                  label="Kazanılan Fırsat"
                  value={String(metrics.wonOpportunities)}
                  color="#4ADE80"
                />
                <MetricCard
                  label="Kaybedilen Fırsat"
                  value={String(metrics.lostOpportunities)}
                  color="#F87171"
                />
                <MetricCard
                  label="Teklif Verilen"
                  value={String(metrics.proposalSentCount)}
                  color="#3B82F6"
                />
                <MetricCard
                  label="Kazanılan Tonaj"
                  value={`${metrics.wonTonnage.toLocaleString('tr-TR')} ton`}
                  color="#F59E0B"
                />
                <MetricCard
                  label="Dönüşüm Oranı"
                  value={`%${metrics.conversionRate.toFixed(1)}`}
                  color={
                    metrics.conversionRate >= 50
                      ? '#4ADE80'
                      : metrics.conversionRate >= 25
                        ? '#FFB347'
                        : '#F87171'
                  }
                />
                <MetricCard
                  label="Pipeline Değeri"
                  value={formatBudget(String(metrics.totalPipelineValue))}
                  color="#8B5CF6"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/5 p-3 backdrop-blur-sm">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-white/60">
        {label}
      </span>
      <span
        className="mt-1 block text-[16px] font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
