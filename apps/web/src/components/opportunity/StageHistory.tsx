'use client';

import { useMemo, useState } from 'react';
import { formatDateTime, getLossReasonLabel, getStageBadgeColor, getStageLabel } from '@crm/shared';
import { Badge } from '@/components/ui/Badge';
import { useStageHistory } from '@/hooks/use-opportunity-stages';

interface StageHistoryProps {
  opportunityId: string;
  compact?: boolean;
}

export function StageHistory({ opportunityId, compact = false }: StageHistoryProps) {
  const { data: logs = [], isLoading } = useStageHistory(opportunityId);
  const [showAll, setShowAll] = useState(false);

  const displayLogs = useMemo(() => {
    if (!compact) return logs;
    if (showAll) return logs;
    return logs.slice(-3);
  }, [logs, compact, showAll]);

  if (isLoading) {
    return <p className="text-[13px] text-muted">Yükleniyor...</p>;
  }

  if (!logs.length) {
    return <p className="text-[13px] text-muted">Henüz aşama geçmişi yok.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative pl-4">
        <div className="absolute left-[6px] top-1 bottom-1 w-[2px] rounded-full bg-border" />

        {displayLogs.map((log) => {
          const stageColor = getStageBadgeColor(log.stage);
          const stageLabel = getStageLabel(log.stage);
          const lossReasonLabel =
            log.stage === 'olumsuz' && log.lossReason ? getLossReasonLabel(log.lossReason) : null;

          return (
            <div key={log.id} className="relative pb-1">
              <div
                className="absolute left-0 top-[6px] h-3 w-3 rounded-full border"
                style={{
                  backgroundColor: `${stageColor}25`,
                  borderColor: `${stageColor}60`,
                }}
              />

              <div className="ml-4 rounded-xl border border-border bg-surface px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge color={stageColor}>{stageLabel}</Badge>
                    {lossReasonLabel && (
                      <Badge color="#F87171">{lossReasonLabel}</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-muted">{formatDateTime(log.createdAt)}</p>
                </div>

                <p className="mt-1 text-[12px] text-muted">
                  {log.changedBy.name} ({log.changedBy.email})
                </p>

                {log.note && (
                  <p className="mt-2 whitespace-pre-wrap text-[13px] text-text">
                    {log.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {compact && logs.length > 3 && (
        <button
          type="button"
          className="self-start text-[13px] font-semibold text-accent hover:text-accent/90"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Son 3 kaydı göster' : 'Tümünü göster'}
        </button>
      )}
    </div>
  );
}

