import { useState } from 'react';
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

interface StageTransitionSheetProps {
  visible: boolean;
  opportunity: OpportunityWithDetails | null;
  fairId: string | null;
  onClose: () => void;
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

  const nextStage = getNextStageInSequence(currentStage);
  const currentIsTerminal = isTerminalStage(currentStage);

  const [targetStage, setTargetStage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [lossReason, setLossReason] = useState<LossReasonValue | ''>('');
  const [submitError, setSubmitError] = useState('');

  const isOlumsuz = targetStage === 'olumsuz';
  const availableOptions: { value: string; label: string }[] = [];
  if (nextStage && !currentIsTerminal) {
    availableOptions.push({ value: nextStage, label: getStageLabel(nextStage) });
  }
  availableOptions.push({ value: 'olumsuz', label: getStageLabel('olumsuz') });

  const canSubmit =
    !!targetStage &&
    (!isOlumsuz || !!lossReason) &&
    !transition.isPending;

  const handleClose = () => {
    if (transition.isPending) return;
    setTargetStage(null);
    setNote('');
    setLossReason('');
    setSubmitError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!targetStage || !canSubmit) return;
    try {
      setSubmitError('');
      await transition.mutateAsync({
        stage: targetStage as 'tanisma' | 'toplanti' | 'teklif' | 'sozlesme' | 'satisa_donustu' | 'olumsuz',
        note: note.trim() || null,
        lossReason: isOlumsuz ? (lossReason as LossReasonValue) : null,
      });
      handleClose();
    } catch {
      setSubmitError('Aşama güncellenemedi. Lütfen tekrar deneyin.');
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
                  {transition.isPending ? 'Güncelleniyor...' : 'Onayla'}
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
