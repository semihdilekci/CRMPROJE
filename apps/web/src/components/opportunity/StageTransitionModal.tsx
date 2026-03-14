'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LOSS_REASONS,
  getStageLabel,
  type LossReasonValue,
  type StageTransitionInput,
} from '@crm/shared';
import type { OpportunityWithCustomer } from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useTransitionStage } from '@/hooks/use-opportunity-stages';
import { useCreateOffer } from '@/hooks/use-offer';
import { useProducts } from '@/hooks/use-products';
import { OfferProductPriceList, type OfferProductRow } from './OfferProductPriceList';

interface StageTransitionModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  fairId?: string;
  currentStage: string;
  targetStage: string;
  opportunity?: OpportunityWithCustomer | null;
}

async function extractApiErrorMessage(err: unknown): Promise<string | null> {
  if (!err || typeof err !== 'object' || !('response' in err)) return null;
  const res = (err as { response?: { data?: unknown; status?: number } }).response;
  if (!res?.data) return null;
  if (res.data instanceof Blob) {
    try {
      const text = await res.data.text();
      const parsed = JSON.parse(text) as { message?: string };
      return parsed?.message ?? null;
    } catch {
      return null;
    }
  }
  const data = res.data as { message?: string };
  return data?.message ?? null;
}

function getPlaceholderByStage(stage: string): string {
  if (stage === 'toplanti') return 'Toplantı notlarınız...';
  if (stage === 'teklif') return 'Teklif detayları...';
  if (stage === 'olumsuz') return 'Olumsuz sonuçlanma hakkında notunuz...';
  return 'Not...';
}

function buildInitialOfferRows(
  opportunity: OpportunityWithCustomer | null | undefined,
  productList: { id: string; name: string }[],
): OfferProductRow[] {
  if (!opportunity) return [];
  const oppProducts = opportunity.opportunityProducts;
  const products = opportunity.products ?? [];
  if (oppProducts?.length) {
    return oppProducts.map((op) => ({
      productId: op.productId ?? '',
      productName: op.productName ?? '',
      price: '',
      currency: 'TRY',
    }));
  }
  return products.map((name) => {
    const p = productList.find((pr) => pr.name === name);
    return {
      productId: p?.id ?? '',
      productName: name,
      price: '',
      currency: 'TRY',
    };
  });
}

export function StageTransitionModal({
  open,
  onClose,
  opportunityId,
  fairId,
  currentStage,
  targetStage,
  opportunity,
}: StageTransitionModalProps) {
  const transition = useTransitionStage(opportunityId, fairId);
  const createOffer = useCreateOffer(opportunityId, fairId);
  const { data: productList = [] } = useProducts();
  const [note, setNote] = useState('');
  const [lossReason, setLossReason] = useState<LossReasonValue | ''>('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [outputFormat, setOutputFormat] = useState<'docx' | 'pdf'>('docx');
  const [offerRows, setOfferRows] = useState<OfferProductRow[]>([]);

  const isTeklif = targetStage === 'teklif';
  const isOlumsuz = targetStage === 'olumsuz';
  const showOtherReason = isOlumsuz && lossReason === 'other';

  useEffect(() => {
    if (open && isTeklif && opportunity) {
      setOfferRows(buildInitialOfferRows(opportunity, productList));
    }
  }, [open, isTeklif, opportunity, productList]);

  const title = useMemo(() => {
    const label = getStageLabel(targetStage);
    return `${label} Aşamasına Geçir`;
  }, [targetStage]);

  const handleClose = () => {
    if (transition.isPending || createOffer.isPending) return;
    setNote('');
    setLossReason('');
    setOtherReasonText('');
    setSubmitError('');
    setOfferRows([]);
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

  const canCreateOffer =
    isTeklif &&
    offerRows.length > 0 &&
    offerRows.every((r) => r.productId && r.price.trim()) &&
    !createOffer.isPending;

  const canSubmit =
    !transition.isPending &&
    !createOffer.isPending &&
    (!isOlumsuz || !!lossReason) &&
    (!isTeklif || offerRows.length > 0 && offerRows.every((r) => r.productId && r.price.trim()));

  const handleCreateOffer = async () => {
    if (!canCreateOffer) return;
    try {
      setSubmitError('');
      await createOffer.mutateAsync({
        outputFormat,
        productItems: offerRows
          .filter((r) => r.productId && r.price.trim())
          .map((r) => ({
            productId: r.productId,
            productName: r.productName,
            price: r.price.trim(),
            currency: r.currency as 'USD' | 'EUR' | 'TRY' | 'GBP',
          })),
      });
    } catch (err: unknown) {
      const msg = await extractApiErrorMessage(err);
      setSubmitError(msg ?? 'Teklif oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitError('');
      if (isTeklif && offerRows.length > 0 && offerRows.every((r) => r.productId && r.price.trim())) {
        await createOffer.mutateAsync({
          outputFormat,
          productItems: offerRows.map((r) => ({
            productId: r.productId,
            productName: r.productName,
            price: r.price.trim(),
            currency: r.currency as 'USD' | 'EUR' | 'TRY' | 'GBP',
          })),
        });
      }
      await transition.mutateAsync(dto);
      handleClose();
    } catch (err: unknown) {
      const msg = await extractApiErrorMessage(err);
      setSubmitError(msg ?? 'Aşama güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2 text-[13px] text-white/60">
          <span className="font-semibold text-white">Mevcut Aşama:</span>{' '}
          {getStageLabel(currentStage)}
        </div>

        {isTeklif && opportunity && (
          <div className="flex flex-col gap-2">
            <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
              Çıktı Formatı
            </label>
            <div className="flex gap-4">
              {(['docx', 'pdf'] as const).map((fmt) => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value={fmt}
                    checked={outputFormat === fmt}
                    onChange={() => setOutputFormat(fmt)}
                    className="rounded border-white/20"
                  />
                  <span className="text-white text-[14px]">
                    {fmt === 'docx' ? 'Word (.docx)' : 'PDF'}
                  </span>
                </label>
              ))}
            </div>
            <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider mt-2">
              İlgilenilen Ürünler (Fiyat + Para Birimi)
            </label>
            <OfferProductPriceList
              rows={offerRows}
              availableProducts={productList}
              onChange={setOfferRows}
            />
            <Button
              variant="secondary"
              onClick={handleCreateOffer}
              disabled={!canCreateOffer}
              className="self-start"
            >
              {createOffer.isPending ? 'Oluşturuluyor...' : 'Teklifi Oluştur ve İndir'}
            </Button>
          </div>
        )}

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

