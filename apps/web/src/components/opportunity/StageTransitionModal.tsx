'use client';

import { useMemo, useState } from 'react';
import {
  LOSS_REASONS,
  getStageLabel,
  type LossReasonValue,
  type StageTransitionInput,
} from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useTransitionStage } from '@/hooks/use-opportunity-stages';

interface StageTransitionModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  fairId?: string;
  currentStage: string;
  targetStage: string;
}

function getPlaceholderByStage(stage: string): string {
  if (stage === 'toplanti') return 'Toplantı notlarınız...';
  if (stage === 'teklif') return 'Teklif detayları...';
  if (stage === 'olumsuz') return 'Olumsuz sonuçlanma hakkında notunuz...';
  return 'Not...';
}

export function StageTransitionModal({
  open,
  onClose,
  opportunityId,
  fairId,
  currentStage,
  targetStage,
}: StageTransitionModalProps) {
  const transition = useTransitionStage(opportunityId, fairId);
  const [note, setNote] = useState('');
  const [lossReason, setLossReason] = useState<LossReasonValue | ''>('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [submitError, setSubmitError] = useState('');

  const isOlumsuz = targetStage === 'olumsuz';
  const showOtherReason = isOlumsuz && lossReason === 'other';

  const title = useMemo(() => {
    const label = getStageLabel(targetStage);
    return `${label} Aşamasına Geçir`;
  }, [targetStage]);

  const handleClose = () => {
    if (transition.isPending) return;
    setNote('');
    setLossReason('');
    setOtherReasonText('');
    setSubmitError('');
    onClose();
  };

  const dto: StageTransitionInput = useMemo(() => {
    let mergedNote = note.trim() || null;
    if (showOtherReason && otherReasonText.trim()) {
      const other = `Diğer: ${otherReasonText.trim()}`;
      mergedNote = mergedNote ? `${mergedNote}\n${other}` : other;
    }

    return {
      stage: targetStage as StageTransitionInput['stage'],
      note: mergedNote,
      lossReason: isOlumsuz ? ((lossReason || null) as StageTransitionInput['lossReason']) : null,
    };
  }, [note, otherReasonText, targetStage, isOlumsuz, lossReason, showOtherReason]);

  const canSubmit = !transition.isPending && (!isOlumsuz || !!lossReason);

  const handleSubmit = async () => {
    try {
      setSubmitError('');
      await transition.mutateAsync(dto);
      handleClose();
    } catch {
      setSubmitError('Aşama güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2 text-[13px] text-white/60">
          <span className="font-semibold text-white">Mevcut Aşama:</span>{' '}
          {getStageLabel(currentStage)}
        </div>

        {isOlumsuz && (
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
              Kayıp Nedeni <span className="text-danger">*</span>
            </label>
            <Select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value as LossReasonValue)}
            >
              <option value="">Seçiniz</option>
              {LOSS_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>

            {showOtherReason && (
              <Input
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                placeholder="Diğer kayıp nedeni..."
              />
            )}
          </div>
        )}

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={getPlaceholderByStage(targetStage)}
          label="Not (opsiyonel)"
        />

        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={transition.isPending}
          >
            İptal
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
            {transition.isPending ? 'Güncelleniyor...' : 'Onayla'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

