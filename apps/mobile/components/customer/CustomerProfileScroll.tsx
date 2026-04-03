import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { CustomerProfileResponse } from '@crm/shared';
import { formatBudget, getStageLabel } from '@crm/shared';
import { GradientView } from '@/components/ui/GradientView';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { getAssetBaseUrl } from '@/lib/api';
import { maskPhone } from '@/lib/phone-mask';
import { usePhoneReveal } from '@/hooks/use-phone-reveal';
import { theme } from '@/constants/theme';
import {
  useUpdateOpportunityNoteForProfile,
  useDeleteOpportunityNoteForProfile,
} from '@/hooks/use-customers';
import { useFairOpportunityFocusStore } from '@/stores/fair-opportunity-focus-store';

const ORDERED_STAGES = ['tanisma', 'toplanti', 'teklif', 'sozlesme'] as const;

function formatMonthYear(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: 'numeric' }).format(date);
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(startDate)}–${new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(endDate)}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function pendingAgeClass(days: number): string {
  if (days >= 30) return 'text-red-400';
  if (days >= 14) return 'text-amber-400';
  return 'text-white/50';
}

function timelineTone(stage: string): {
  card: string;
  badge: string;
  badgeText: string;
} {
  if (stage === 'satisa_donustu') {
    return {
      card: 'border-green-400/30 bg-green-500/10',
      badge: 'border-green-400/30 bg-green-500/15',
      badgeText: '✓ Satışa Dönüştü',
    };
  }
  if (stage === 'olumsuz') {
    return {
      card: 'border-red-400/25 bg-red-500/10',
      badge: 'border-red-400/25 bg-red-500/10',
      badgeText: '✕ Olumsuz',
    };
  }
  return {
    card: 'border-violet-500/30 bg-violet-500/10',
    badge: 'border-violet-500/25 bg-violet-500/15',
    badgeText: `● ${getStageLabel(stage)}`,
  };
}

interface CustomerProfileScrollProps {
  profile: CustomerProfileResponse;
  customerId: string;
  onEditPress: () => void;
  onDeletePress: () => void;
}

export function CustomerProfileScroll({
  profile,
  customerId,
  onEditPress,
  onDeletePress,
}: CustomerProfileScrollProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateNote = useUpdateOpportunityNoteForProfile(customerId);
  const deleteNote = useDeleteOpportunityNoteForProfile(customerId);
  const { isRevealed, isAuthenticating, requestReveal } = usePhoneReveal();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const timeline = useMemo(() => {
    return [...profile.opportunityTimeline].sort(
      (a, b) => new Date(b.fairStartDate).getTime() - new Date(a.fairStartDate).getTime()
    );
  }, [profile.opportunityTimeline]);

  const noteList = useMemo(() => {
    return [...profile.allNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [profile.allNotes]);

  const initials = profile.customer.company.slice(0, 2).toLocaleUpperCase('tr');
  const cardUri = profile.customer.cardImage
    ? profile.customer.cardImage.startsWith('http')
      ? profile.customer.cardImage
      : `${getAssetBaseUrl()}${profile.customer.cardImage}`
    : null;

  const canEditNote = (createdById: string) =>
    user?.id === createdById || user?.role === 'admin';

  const handleSaveNote = async (opportunityId: string, noteId: string) => {
    const content = (noteDrafts[noteId] ?? '').trim();
    if (!content) return;
    await updateNote.mutateAsync({
      opportunityId,
      noteId,
      dto: { content },
    });
    setEditingNoteId(null);
  };

  const handleDeleteNote = (opportunityId: string, noteId: string) => {
    Alert.alert('Notu sil', 'Bu notu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteNote.mutate({ opportunityId, noteId }),
      },
    ]);
  };

  const goFair = (fairId: string, opportunityId: string) => {
    useFairOpportunityFocusStore.getState().setPending(fairId, opportunityId);
    router.push(
      `/(drawer)/(tabs)/fairs/${fairId}?opportunityId=${encodeURIComponent(opportunityId)}`
    );
  };

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="rounded-2xl border border-white/10 bg-white/5 p-5 mt-2">
        <View className="flex-row flex-wrap gap-4">
          {cardUri ? (
            <Image
              source={{ uri: cardUri }}
              className="w-[88px] h-[88px] rounded-xl border border-white/20"
              resizeMode="cover"
            />
          ) : (
            <GradientView
              direction="horizontal"
              style={{
                width: 88,
                height: 88,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(139,92,246,0.35)',
              }}
            >
              <Text className="text-white text-3xl font-bold">{initials}</Text>
            </GradientView>
          )}
          <View className="flex-1 min-w-[200px]">
            <Text className="text-white text-xl font-semibold">{profile.customer.company}</Text>
            <Text className="text-white/50 text-[15px] mt-1">{profile.customer.name}</Text>
            {profile.customer.phone ? (
              <View className="flex-row items-center gap-2 mt-2">
                {isRevealed ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${profile.customer.phone}`)}>
                    <Text className="text-white/80 text-sm font-mono">
                      📞 {profile.customer.phone}
                    </Text>
                  </Pressable>
                ) : (
                  <Text className="text-white/50 text-sm font-mono">
                    📞 {maskPhone(profile.customer.phone)}
                  </Text>
                )}
                <Pressable
                  onPress={requestReveal}
                  disabled={isAuthenticating || isRevealed}
                  style={{
                    borderWidth: 1,
                    borderColor: isRevealed
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(139,92,246,0.4)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    opacity: isRevealed ? 0.4 : 1,
                  }}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                  ) : (
                    <Text style={{ color: theme.colors.accent, fontSize: 11 }}>
                      {isRevealed ? '✓ Açık' : '🔓 Göster'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
            {profile.customer.email ? (
              <Pressable onPress={() => Linking.openURL(`mailto:${profile.customer.email}`)}>
                <Text className="text-white/80 text-sm mt-1">✉ {profile.customer.email}</Text>
              </Pressable>
            ) : null}
            <Text className="text-white/30 text-[12px] mt-3">
              İlk Temas: {formatMonthYear(profile.kpi.firstContact)} · Son Temas:{' '}
              {formatMonthYear(profile.kpi.lastContact)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2 mt-4">
          <Button onPress={onEditPress} className="flex-1">
            ✏️ Düzenle
          </Button>
          <Button variant="danger" onPress={onDeletePress} className="flex-1">
            🗑 Sil
          </Button>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-4">
        <View className="min-w-[45%] flex-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
          <Text className="text-violet-400 text-2xl font-bold text-center">
            {profile.kpi.totalOpportunities}
          </Text>
          <Text className="text-white/50 text-[10px] uppercase tracking-wider text-center mt-1">
            Toplam Fırsat
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
          <Text className="text-green-400 text-2xl font-bold text-center">
            {profile.kpi.wonOpportunities}
          </Text>
          <Text className="text-white/50 text-[10px] uppercase tracking-wider text-center mt-1">
            Kazanılan
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
          <Text className="text-amber-400 text-2xl font-bold text-center">
            %{profile.kpi.conversionRate}
          </Text>
          <Text className="text-white/50 text-[10px] uppercase tracking-wider text-center mt-1">
            Dönüşüm Oranı
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
          <Text className="text-orange-300 text-xl font-bold text-center" numberOfLines={1}>
            {profile.kpi.totalBudgetRaw
              ? `${formatBudget(profile.kpi.totalBudgetRaw)} ${profile.kpi.totalBudgetCurrency ?? ''}`
              : '—'}
          </Text>
          <Text className="text-white/50 text-[10px] uppercase tracking-wider text-center mt-1">
            Toplam Bütçe
          </Text>
        </View>
      </View>

      {profile.pendingOpportunities.length > 0 ? (
        <View className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-amber-400/15 px-4 py-3">
            <Text className="text-white/50 text-[12px] font-semibold uppercase tracking-wide">
              Bekleyen Aksiyonlar
            </Text>
            <View className="rounded-full border border-amber-400/25 bg-amber-400/15 px-2 py-0.5">
              <Text className="text-amber-400 text-[11px] font-semibold">
                {profile.pendingOpportunities.length}
              </Text>
            </View>
          </View>
          {profile.pendingOpportunities.map((item) => (
            <View
              key={item.id}
              className="border-t border-amber-400/10 px-4 py-3 first:border-t-0"
            >
              <Text className="text-white text-[14px] font-semibold">{item.fairName}</Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                <Text className="rounded-full border border-violet-500/25 bg-violet-500/15 px-2 py-0.5 text-violet-300 text-[11px]">
                  {getStageLabel(item.currentStage)} Aşamasında
                </Text>
                <Text className={`text-[12px] ${pendingAgeClass(item.daysSinceLastStageChange)}`}>
                  🕐 {item.daysSinceLastStageChange} gündür bu aşamada
                </Text>
              </View>
              <Text className="text-white/50 text-[12px] mt-1">
                {item.budgetRaw
                  ? `${formatBudget(item.budgetRaw)} ${item.budgetCurrency ?? ''}`
                  : 'Bütçe belirtilmemiş'}
              </Text>
              <Pressable onPress={() => goFair(item.fairId, item.id)} className="mt-2 self-end">
                <Text className="text-violet-300 text-[12px] font-medium">Fırsata Git →</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <View className="border-b border-white/10 px-4 py-3">
          <Text className="text-white/50 text-[12px] font-semibold uppercase tracking-wide">
            Fuar Katılım Geçmişi
          </Text>
        </View>
        <View className="p-4 gap-3">
          {timeline.length === 0 ? (
            <Text className="text-white/50 text-sm text-center py-4">Henüz fuar kaydı yok</Text>
          ) : (
            timeline.map((item, index) => {
              const tone = timelineTone(item.currentStage);
              const currentYear = new Date(item.fairStartDate).getFullYear();
              const prevYear =
                index > 0 ? new Date(timeline[index - 1]!.fairStartDate).getFullYear() : null;
              const showYear = currentYear !== prevYear;
              const stageSet = new Set(item.stageLogs.map((log) => log.stage));
              const stageLabel = ORDERED_STAGES.filter((stage) => stageSet.has(stage))
                .map((stage) => getStageLabel(stage))
                .join(' · ');
              return (
                <View key={item.id}>
                  {showYear ? (
                    <Text className="text-white/30 text-[11px] font-bold uppercase mb-2 pl-1">
                      {currentYear}
                    </Text>
                  ) : null}
                  <View className={`rounded-xl border p-3 ${tone.card}`}>
                    <View className="flex-row flex-wrap justify-between gap-2">
                      <Text className="text-white text-[15px] font-semibold flex-1">{item.fairName}</Text>
                      <Text
                        className={`rounded-full border px-2 py-1 text-[10px] ${tone.badge} text-white`}
                      >
                        {tone.badgeText}
                      </Text>
                    </View>
                    <Text className="text-white/60 text-[12px] mt-2">
                      📅 {formatDateRange(item.fairStartDate, item.fairEndDate)} · 💰{' '}
                      <Text className="text-orange-300">
                        {item.budgetRaw
                          ? `${formatBudget(item.budgetRaw)} ${item.budgetCurrency ?? ''}`
                          : '—'}
                      </Text>
                      {' · '}📦{' '}
                      {item.opportunityProducts.length > 0
                        ? item.opportunityProducts
                            .map((p) =>
                              p.quantity != null
                                ? `${p.product.name} (${p.quantity} ${p.unit})`
                                : p.product.name
                            )
                            .join(', ')
                        : '—'}
                    </Text>
                    <View className="mt-3 flex-row items-center flex-wrap">
                      {ORDERED_STAGES.map((stage, stageIndex) => {
                        const isPassed = stageSet.has(stage);
                        const isCurrent = item.currentStage === stage;
                        const isWonTerminal =
                          stageIndex === ORDERED_STAGES.length - 1 &&
                          item.currentStage === 'satisa_donustu';
                        const isLostTerminal =
                          stageIndex === ORDERED_STAGES.length - 1 &&
                          item.currentStage === 'olumsuz';
                        const dotColor = isWonTerminal
                          ? '#4ade80'
                          : isLostTerminal
                            ? '#f87171'
                            : isPassed || isCurrent
                              ? '#8b5cf6'
                              : 'rgba(255,255,255,0.22)';
                        return (
                          <View key={stage} className="flex-row items-center">
                            <View
                              className="rounded-full"
                              style={{
                                width: 7,
                                height: 7,
                                backgroundColor: dotColor,
                                shadowColor: isCurrent ? '#8b5cf6' : undefined,
                                shadowOpacity: isCurrent ? 0.7 : 0,
                                shadowRadius: isCurrent ? 5 : 0,
                              }}
                            />
                            {stageIndex < ORDERED_STAGES.length - 1 ? (
                              <View
                                className="mx-[7px] h-px w-[22px]"
                                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                    <Text className="text-white/50 text-[11px] mt-2">{stageLabel || '—'}</Text>
                    {item.notes[0] ? (
                      <Text className="text-white/55 text-[13px] italic mt-3 rounded-lg bg-white/5 px-3 py-2">
                        💬 &quot;{item.notes[0].content}&quot;
                      </Text>
                    ) : null}
                    <Pressable onPress={() => goFair(item.fairId, item.id)} className="mt-3 self-end">
                      <Text className="text-violet-300 text-[12px] font-medium">Fırsata Git →</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-8">
        <View className="border-b border-white/10 px-4 py-3">
          <Text className="text-white/50 text-[12px] font-semibold uppercase tracking-wide">
            Notlar
          </Text>
        </View>
        <View className="px-4">
          {noteList.map((note) => {
            const isEditing = editingNoteId === note.id;
            const draft = noteDrafts[note.id] ?? note.content;
            const canEdit = canEditNote(note.createdBy.id);
            return (
              <View key={note.id} className="border-t border-white/10 py-4 first:border-t-0">
                <View className="flex-row flex-wrap gap-2 mb-2">
                  <Text className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                    [{note.fairName}]
                  </Text>
                  <Text className="text-white/50 text-[11px]">{note.createdBy.name}</Text>
                  <Text className="text-white/50 text-[11px]">·</Text>
                  <Text className="text-white/50 text-[11px]">{formatDateTime(note.createdAt)}</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    value={draft}
                    onChangeText={(t) => setNoteDrafts((prev) => ({ ...prev, [note.id]: t }))}
                    multiline
                    className="rounded-lg border border-white/20 bg-white/5 text-white text-[13px] px-3 py-2 min-h-[80px]"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                ) : (
                  <Text className="text-white/80 text-[13px] leading-5">{note.content}</Text>
                )}
                {canEdit ? (
                  <View className="flex-row justify-end gap-2 mt-3">
                    {isEditing ? (
                      <>
                        <Pressable
                          onPress={() => setEditingNoteId(null)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
                        >
                          <Text className="text-white/60 text-[12px]">İptal</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleSaveNote(note.opportunityId, note.id)}
                          className="rounded-lg border border-violet-500/35 bg-violet-500/15 px-3 py-1.5"
                        >
                          <Text className="text-violet-300 text-[12px]">Kaydet</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => {
                            setEditingNoteId(note.id);
                            setNoteDrafts((prev) => ({ ...prev, [note.id]: note.content }));
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 w-8 h-8 items-center justify-center"
                        >
                          <Text className="text-[12px]">✏️</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteNote(note.opportunityId, note.id)}
                          className="rounded-lg border border-white/10 bg-white/5 w-8 h-8 items-center justify-center"
                        >
                          <Text className="text-[12px]">🗑</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
          <Pressable
            onPress={() =>
              Alert.alert(
                'Not ekleme',
                'Not eklemek için ilgili fuarın fırsat kartından not ekleyebilirsiniz.'
              )
            }
            className="my-4 w-full rounded-xl border border-dashed border-violet-500/25 bg-violet-500/10 px-4 py-3"
          >
            <Text className="text-violet-300/90 text-sm text-center">+ Not Ekle</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
