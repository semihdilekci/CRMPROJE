'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, getLossReasonLabel, getStageBadgeColor, getStageLabel } from '@crm/shared';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import {
  useDeleteLastStageLog,
  useStageHistory,
  useUpdateStageLog,
} from '@/hooks/use-opportunity-stages';

interface StageHistoryProps {
  opportunityId: string;
  compact?: boolean;
  editable?: boolean;
  allowDeleteLast?: boolean;
  fairId?: string;
}

interface EditableLogState {
  createdAtInput: string;
  note: string;
}

function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localInputToIso(value: string, fallbackIso: string): string {
  if (!value) return fallbackIso;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackIso;
  return date.toISOString();
}

const EMPTY_LOGS: Array<{
  id: string;
  stage: string;
  note: string | null;
  lossReason: string | null;
  createdAt: string;
  changedBy: { id: string; name: string; email: string };
}> = [];

export function StageHistory({
  opportunityId,
  compact = false,
  editable = false,
  allowDeleteLast = false,
  fairId,
}: StageHistoryProps) {
  const { data, isLoading } = useStageHistory(opportunityId);
  const logs = data ?? EMPTY_LOGS;
  const updateStageLog = useUpdateStageLog(opportunityId, fairId);
  const deleteLastStageLog = useDeleteLastStageLog(opportunityId, fairId);

  const [showAll, setShowAll] = useState(false);
  const [editableLogs, setEditableLogs] = useState<Record<string, EditableLogState>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, EditableLogState> = {};
    logs.forEach((log) => {
      next[log.id] = {
        createdAtInput: isoToLocalInput(log.createdAt),
        note: log.note ?? '',
      };
    });
    setEditableLogs(next);
    setRowErrors({});
  }, [logs]);

  const displayLogs = useMemo(() => {
    if (!compact) return logs;
    if (showAll) return logs;
    return logs.slice(-3);
  }, [logs, compact, showAll]);

  if (isLoading) {
    return <p className="text-[13px] text-white/60">Yükleniyor...</p>;
  }

  if (!logs.length) {
    return <p className="text-[13px] text-white/60">Henüz aşama geçmişi yok.</p>;
  }

  const overallLastId = logs[logs.length - 1]?.id ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative pl-4">
        <div className="absolute left-[6px] top-1 bottom-1 w-[2px] rounded-full bg-border" />

        {displayLogs.map((log) => {
          const stageColor = getStageBadgeColor(log.stage);
          const stageLabel = getStageLabel(log.stage);
          const lossReasonLabel =
            log.stage === 'olumsuz' && log.lossReason ? getLossReasonLabel(log.lossReason) : null;
          const isOverallLast = log.id === overallLastId;
          const isEditing = !!editingRows[log.id];
          const state = editableLogs[log.id] ?? {
            createdAtInput: isoToLocalInput(log.createdAt),
            note: log.note ?? '',
          };

          const handleSave = async () => {
            if (!editable || !isEditing) return;
            try {
              setRowErrors((prev) => ({ ...prev, [log.id]: '' }));
              await updateStageLog.mutateAsync({
                logId: log.id,
                dto: {
                  createdAt: localInputToIso(state.createdAtInput, log.createdAt),
                  note: state.note || null,
                },
              });
              setEditingRows((prev) => ({ ...prev, [log.id]: false }));
            } catch {
              setRowErrors((prev) => ({
                ...prev,
                [log.id]: 'Aşama kaydı güncellenemedi. Lütfen tekrar deneyin.',
              }));
            }
          };

          const handleDelete = async () => {
            if (!editable || !allowDeleteLast || !isOverallLast) return;
            try {
              setRowErrors((prev) => ({ ...prev, [log.id]: '' }));
              await deleteLastStageLog.mutateAsync(log.id);
            } catch {
              setRowErrors((prev) => ({
                ...prev,
                [log.id]: 'Son aşama kaydı silinemedi. Lütfen tekrar deneyin.',
              }));
            }
          };

          return (
            <div key={log.id} className="relative pb-1">
              <div
                className="absolute left-0 top-[6px] h-3 w-3 rounded-full border"
                style={{
                  backgroundColor: `${stageColor}25`,
                  borderColor: `${stageColor}60`,
                }}
              />

              <div className="ml-4 rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge color={stageColor}>{stageLabel}</Badge>
                    {lossReasonLabel && (
                      <Badge color="#F87171">{lossReasonLabel}</Badge>
                    )}
                  </div>
                  {editable && isEditing ? (
                    <Input
                      type="datetime-local"
                      value={state.createdAtInput}
                      onChange={(e) =>
                        setEditableLogs((prev) => ({
                          ...prev,
                          [log.id]: { ...state, createdAtInput: e.target.value },
                        }))
                      }
                      className="h-8 w-[210px] text-[12px]"
                    />
                  ) : (
                    <p className="text-[12px] text-white/60">{formatDateTime(log.createdAt)}</p>
                  )}
                </div>

                <p className="mt-1 text-[12px] text-white/60">
                  {log.changedBy.name} ({log.changedBy.email})
                </p>

                {editable && isEditing ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <Textarea
                      value={state.note}
                      onChange={(e) =>
                        setEditableLogs((prev) => ({
                          ...prev,
                          [log.id]: { ...state, note: e.target.value },
                        }))
                      }
                      placeholder="Aşama notu..."
                      className="min-h-[70px] text-[13px]"
                    />
                    {rowErrors[log.id] && (
                      <p className="text-[12px] text-danger">{rowErrors[log.id]}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      {allowDeleteLast && isOverallLast && log.stage !== 'tanisma' && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[12px] text-danger transition-colors hover:border-danger hover:bg-danger-soft"
                          title="Son aşama kaydını sil"
                        >
                          🗑
                        </button>
                      )}
                      <Button
                        type="button"
                        className="text-[12px]"
                        onClick={handleSave}
                        disabled={updateStageLog.isPending}
                      >
                        {updateStageLog.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {log.note && (
                      <p className="mt-2 whitespace-pre-wrap text-[13px] text-white">
                        {log.note}
                      </p>
                    )}
                    {editable && (
                      <div className="mt-2 flex justify-end gap-2">
                        {allowDeleteLast && isOverallLast && log.stage !== 'tanisma' && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[12px] text-danger transition-colors hover:border-danger hover:bg-danger-soft"
                            title="Son aşama kaydını sil"
                          >
                            🗑
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingRows((prev) => ({
                              ...prev,
                              [log.id]: !prev[log.id],
                            }))
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-[12px] text-white/60 transition-colors hover:border-violet-400 hover:text-violet-400"
                          title="Bu aşamayı düzenle"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </>
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

