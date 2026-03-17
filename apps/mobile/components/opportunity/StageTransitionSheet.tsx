import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { OpportunityWithDetails } from '@crm/shared';
import {
  LOSS_REASONS,
  getStageLabel,
  getNextStageInSequence,
  isTerminalStage,
  type LossReasonValue,
} from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTransitionStage } from '@/hooks/use-opportunity-stages';
import { useCreateOffer } from '@/hooks/use-offer';
import { useProducts } from '@/hooks/use-products';
import {
  OfferProductPriceList,
  type OfferProductRow,
} from './OfferProductPriceList';
import { extractApiErrorMessage } from '@/lib/error-utils';

interface StageTransitionSheetProps {
  visible: boolean;
  opportunity: OpportunityWithDetails | null;
  fairId: string | null;
  onClose: () => void;
}

function buildInitialOfferRows(
  opp: OpportunityWithDetails | null,
  productList: { id: string; name: string }[]
): OfferProductRow[] {
  if (!opp) return [];
  const oppProducts = opp.opportunityProducts ?? [];
  const products = opp.products ?? [];
  if (oppProducts.length > 0) {
    return oppProducts.map((op) => ({
      productId: op.productId ?? '',
      productName: op.productName ?? '',
      qty: op.quantity ?? 1,
      unit: (op.unit ?? 'ton') as 'ton' | 'kg' | 'adet',
      price: '',
      currency: 'TRY',
    }));
  }
  return products.map((name) => {
    const p = productList.find((pr) => pr.name === name);
    return {
      productId: p?.id ?? '',
      productName: name,
      qty: 1,
      unit: 'ton' as const,
      price: '',
      currency: 'TRY',
    };
  });
}

export function StageTransitionSheet({
  visible,
  opportunity,
  fairId,
  onClose,
}: StageTransitionSheetProps) {
  const currentStage = opportunity?.currentStage ?? 'tanisma';
  const opportunityId = opportunity?.id ?? '';
  const transition = useTransitionStage(opportunityId, fairId ?? undefined);
  const createOffer = useCreateOffer(opportunityId, fairId ?? undefined);
  const { data: productList = [] } = useProducts();

  const nextStage = getNextStageInSequence(currentStage);
  const currentIsTerminal = isTerminalStage(currentStage);

  const [targetStage, setTargetStage] = useState<string | null>(null);
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
    if (visible && isTeklif && opportunity) {
      setOfferRows(buildInitialOfferRows(opportunity, productList));
    }
  }, [visible, isTeklif, opportunity, productList]);

  const availableOptions: { value: string; label: string }[] = [];
  if (nextStage && !currentIsTerminal) {
    availableOptions.push({ value: nextStage, label: getStageLabel(nextStage) });
  }
  availableOptions.push({ value: 'olumsuz', label: getStageLabel('olumsuz') });

  const isValidOfferRow = (r: OfferProductRow) =>
    !!r.productId && !!r.price.trim() && r.qty > 0 && !!r.unit;

  const canCreateOffer =
    isTeklif &&
    offerRows.length > 0 &&
    offerRows.every(isValidOfferRow) &&
    !createOffer.isPending;

  const canSubmit =
    !transition.isPending &&
    !createOffer.isPending &&
    !!targetStage &&
    (!isOlumsuz || !!lossReason) &&
    (!isTeklif ||
      (offerRows.length > 0 && offerRows.every(isValidOfferRow)));

  const toProductItems = (rows: OfferProductRow[]) =>
    rows
      .filter((r) => isValidOfferRow(r))
      .map((r) => ({
        productId: r.productId,
        productName: r.productName,
        qty: r.qty,
        unit: r.unit,
        price: r.price.trim(),
        currency: r.currency as 'USD' | 'EUR' | 'TRY' | 'GBP',
      }));

  const handleClose = () => {
    if (transition.isPending || createOffer.isPending) return;
    setTargetStage(null);
    setNote('');
    setLossReason('');
    setOtherReasonText('');
    setSubmitError('');
    setOfferRows([]);
    onClose();
  };

  const handleCreateOffer = async () => {
    if (!canCreateOffer) return;
    try {
      setSubmitError('');
      await createOffer.mutateAsync({
        outputFormat,
        productItems: toProductItems(offerRows),
      });
    } catch (err) {
      if (__DEV__) {
        console.error('[createOffer]', err);
      }
      const msg = await extractApiErrorMessage(err);
      setSubmitError(msg ?? 'Teklif oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmit = async () => {
    if (!targetStage || !canSubmit) return;
    try {
      setSubmitError('');
      if (
        isTeklif &&
        offerRows.length > 0 &&
        offerRows.every(isValidOfferRow)
      ) {
        await createOffer.mutateAsync({
          outputFormat,
          productItems: toProductItems(offerRows),
          _skipDownload: true,
        });
      }
      let mergedNote = note.trim() || null;
      if (showOtherReason && otherReasonText.trim()) {
        const other = `Diğer: ${otherReasonText.trim()}`;
        mergedNote = mergedNote ? `${mergedNote}\n${other}` : other;
      }
      await transition.mutateAsync({
        stage: targetStage as
          | 'tanisma'
          | 'toplanti'
          | 'teklif'
          | 'sozlesme'
          | 'satisa_donustu'
          | 'olumsuz',
        note: mergedNote,
        lossReason: isOlumsuz ? (lossReason as LossReasonValue) : null,
      });
      handleClose();
    } catch (err) {
      const msg = await extractApiErrorMessage(err);
      setSubmitError(msg ?? 'Aşama güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  if (!opportunity) return null;

  return (
    <BottomSheet
      isVisible={visible}
      onClose={handleClose}
      title="Aşama Değiştir"
    >
      <ScrollView
        className="max-h-[60vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
            <Text className="text-white/60 text-[12px]">Mevcut Aşama</Text>
            <Text className="text-white font-semibold text-[14px]">
              {getStageLabel(currentStage)}
            </Text>
          </View>

          {currentIsTerminal ? (
            <Text className="text-white/60 text-[13px]">
              Bu fırsat son aşamada. Başka bir aşamaya geçirilemez.
            </Text>
          ) : (
            <>
              <View>
                <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                  Hedef Aşama
                </Text>
                <View className="gap-2">
                  {availableOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setTargetStage(opt.value)}
                      className={`rounded-xl border px-4 py-3 ${
                        targetStage === opt.value
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/20'
                          : 'border-white/20 bg-white/5'
                      }`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <Text className="text-white font-medium">{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {isTeklif && opportunity && (
                <View className="gap-2">
                  <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
                    Çıktı Formatı
                  </Text>
                  <View className="flex-row gap-2">
                    {(['docx', 'pdf'] as const).map((fmt) => (
                      <Pressable
                        key={fmt}
                        onPress={() => setOutputFormat(fmt)}
                        className={`flex-1 rounded-xl border px-4 py-3 ${
                          outputFormat === fmt
                            ? 'border-[#8b5cf6] bg-[#8b5cf6]/20'
                            : 'border-white/20 bg-white/5'
                        }`}
                      >
                        <Text className="text-white text-center font-medium">
                          {fmt === 'docx' ? 'Word (.docx)' : 'PDF'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mt-2">
                    İlgilenilen Ürünler (Miktar, Birim, Toplam Fiyat)
                  </Text>
                  <OfferProductPriceList
                    rows={offerRows}
                    availableProducts={productList}
                    onChange={setOfferRows}
                  />
                  <Button
                    variant="secondary"
                    onPress={handleCreateOffer}
                    disabled={!canCreateOffer}
                  >
                    {createOffer.isPending
                      ? 'Oluşturuluyor...'
                      : 'Teklifi Oluştur ve İndir'}
                  </Button>
                </View>
              )}

              {isOlumsuz && (
                <View>
                  <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                    Kayıp Nedeni <Text className="text-[#F87171]">*</Text>
                  </Text>
                  <View className="gap-2">
                    {LOSS_REASONS.map((r) => (
                      <Pressable
                        key={r.value}
                        onPress={() => setLossReason(r.value as LossReasonValue)}
                        className={`rounded-xl border px-4 py-2.5 ${
                          lossReason === r.value
                            ? 'border-[#8b5cf6] bg-[#8b5cf6]/20'
                            : 'border-white/20 bg-white/5'
                        }`}
                      >
                        <Text className="text-white text-[14px]">{r.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {showOtherReason && (
                    <View className="mt-2">
                      <Input
                        label="Diğer kayıp nedeni"
                        placeholder="Açıklayın..."
                        value={otherReasonText}
                        onChangeText={setOtherReasonText}
                      />
                    </View>
                  )}
                </View>
              )}

              <Input
                label="Not (opsiyonel)"
                placeholder="Not ekleyin..."
                value={note}
                onChangeText={setNote}
                multiline
              />

              {submitError ? (
                <View className="rounded-lg bg-[#F87171]/20 px-3 py-2">
                  <Text className="text-[#F87171] text-[13px]">
                    {submitError}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row gap-3 mt-2">
                <Button
                  variant="secondary"
                  onPress={handleClose}
                  disabled={transition.isPending}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1"
                >
                  {transition.isPending || createOffer.isPending
                    ? 'Güncelleniyor...'
                    : 'Onayla'}
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
