import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Linking,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import type { OpportunityWithDetails } from '@crm/shared';
import {
  formatBudget,
  formatDateTime,
  getConversionRateLabel,
  getConversionRateColor,
  getStageBadgeColor,
  getStageLabel,
} from '@crm/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDeleteOpportunity } from '@/hooks/use-opportunities';
import { useStageHistory } from '@/hooks/use-opportunity-stages';
import {
  useOpportunityNotes,
  useCreateOpportunityNote,
  useUpdateOpportunityNote,
  useDeleteOpportunityNote,
} from '@/hooks/use-opportunity-notes';
import { useHasOfferDocument, useDownloadOfferDocument } from '@/hooks/use-offer';
import { useAuthStore } from '@/stores/auth-store';
import { getAssetBaseUrl } from '@/lib/api';
import { useUpdateCustomer } from '@/hooks/use-customers';

function formatTonnageShort(quantity: number | null, unit: string): string {
  if (quantity == null || quantity === 0) return '';
  if (unit === 'ton') return `${quantity}t`;
  if (unit === 'kg') return `${quantity} kg`;
  return `${quantity} ${unit}`;
}

function formatTonnageLine(quantity: number | null, unit: string): string {
  if (quantity == null || quantity === 0) return '';
  const u = unit === 'ton' ? 'ton' : unit === 'kg' ? 'kg' : unit;
  return `${Number(quantity).toLocaleString('tr-TR')} ${u}`;
}

interface OpportunityCardProps {
  opportunity: OpportunityWithDetails;
  fairId: string;
  onEdit: () => void;
  onStageChange?: () => void;
}

export function OpportunityCard({
  opportunity,
  fairId,
  onEdit,
  onStageChange,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const user = useAuthStore((s) => s.user);
  const deleteOpportunity = useDeleteOpportunity(fairId);
  const updateCustomer = useUpdateCustomer();
  const { data: stageLogs = [] } = useStageHistory(opportunity.id, {
    enabled: expanded,
  });
  const { data: notes = [] } = useOpportunityNotes(opportunity.id, {
    enabled: expanded,
  });
  const createNote = useCreateOpportunityNote(opportunity.id);
  const updateNote = useUpdateOpportunityNote(opportunity.id);
  const deleteNote = useDeleteOpportunityNote(opportunity.id);
  const { data: hasOffer } = useHasOfferDocument(opportunity.id);
  const downloadOffer = useDownloadOfferDocument(opportunity.id);

  const { customer } = opportunity;
  const hasProducts =
    (opportunity.opportunityProducts?.length ?? 0) > 0 ||
    (opportunity.products?.length ?? 0) > 0;
  const displayProducts: { productName: string; quantity: number | null; unit: string }[] =
    opportunity.opportunityProducts?.length
      ? opportunity.opportunityProducts.map((op) => ({
          productName: op.productName ?? op.productId,
          quantity: op.quantity,
          unit: op.unit ?? 'ton',
        }))
      : (opportunity.products ?? []).map((name) => ({
          productName: name,
          quantity: null as number | null,
          unit: 'ton',
        }));

  const rateColor = getConversionRateColor(opportunity.conversionRate);
  const rateLabel = getConversionRateLabel(opportunity.conversionRate);
  const stageColor = getStageBadgeColor(opportunity.currentStage);
  const stageLabel = getStageLabel(opportunity.currentStage);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Fırsatı Sil',
      `"${customer.name}" (${customer.company}) fırsatını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteOpportunity.mutate(opportunity.id),
        },
      ]
    );
  };

  const handlePhonePress = () => {
    if (customer.phone) Linking.openURL(`tel:${customer.phone}`);
  };

  const handleEmailPress = () => {
    if (customer.email) Linking.openURL(`mailto:${customer.email}`);
  };

  const handleAddNote = async () => {
    const content = newNoteContent.trim();
    if (!content) return;
    try {
      await createNote.mutateAsync(content);
      setNewNoteContent('');
      setShowAddNote(false);
    } catch {
      Alert.alert('Hata', 'Not eklenemedi');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editingContent.trim()) return;
    try {
      await updateNote.mutateAsync({ noteId: editingNoteId, content: editingContent.trim() });
      setEditingNoteId(null);
      setEditingContent('');
    } catch {
      Alert.alert('Hata', 'Not güncellenemedi');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Notu Sil', 'Bu notu silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteNote.mutate(noteId),
      },
    ]);
  };

  const canEditNote = (note: { createdBy: { id: string } }) =>
    user?.id === note.createdBy.id || user?.role === 'admin';

  const handleDeleteCard = () => {
    Alert.alert(
      'Kartviziti Sil',
      'Kartvizit fotoğrafını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () =>
            updateCustomer.mutate({
              id: customer.id,
              dto: { cardImage: null },
              fairId,
            }),
        },
      ],
    );
  };

  return (
    <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden mb-2">
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center justify-between p-4 min-h-[100px]"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="flex-1 min-w-0">
          <Text className="text-white font-bold text-[15px]" numberOfLines={2}>
            {customer.name}
          </Text>
          <Text className="text-white/80 font-semibold text-[13px] mt-0.5" numberOfLines={2}>
            {customer.company}
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {opportunity.conversionRate && (
              <Badge color={rateColor}>{rateLabel}</Badge>
            )}
            <Badge color={stageColor}>{stageLabel}</Badge>
            {displayProducts.slice(0, 2).map((p, i) => (
              <Badge key={`${p.productName}-${i}`}>
                {p.quantity != null && p.quantity > 0
                  ? `${p.productName} (${formatTonnageShort(p.quantity, p.unit)})`
                  : p.productName}
              </Badge>
            ))}
            {displayProducts.length > 2 && (
              <Badge>+{displayProducts.length - 2}</Badge>
            )}
          </View>
        </View>
        <View className="ml-3 flex-row items-center gap-2">
          {expanded && notes.length > 0 ? (
            <Text className="text-[12px]">💬 {notes.length}</Text>
          ) : null}
          {customer.cardImage ? (
            <Text className="text-[14px]">📇</Text>
          ) : null}
          <Text className="text-white/60 text-[12px]">
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </Pressable>

      {expanded && (
        <View className="border-t border-white/10 px-4 pb-4 pt-3">
          <View className="gap-2">
            <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
              <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1">
                Pipeline
              </Text>
              <Text className="text-white font-medium">
                {stageLabel}
              </Text>
              {onStageChange && (
                <Button
                  variant="secondary"
                  onPress={onStageChange}
                  className="mt-2"
                >
                  Aşama Değiştir
                </Button>
              )}
            </View>

            {opportunity.budgetRaw ? (
              <Text className="text-[13px]">
                <Text className="text-white/60">Tahmini Bütçe: </Text>
                <Text className="text-white font-semibold">
                  {formatBudget(opportunity.budgetRaw)}{' '}
                  {opportunity.budgetCurrency ?? ''}
                </Text>
              </Text>
            ) : null}

            <Text className="text-white/60 text-[13px]">
              Kayıt: {formatDateTime(opportunity.createdAt)}
            </Text>

            {(customer.phone || customer.email) && (
              <View className="gap-2">
                {customer.phone ? (
                  <Pressable onPress={handlePhonePress}>
                    <Text className="text-white/90 text-[13px]">
                      📞 {customer.phone}
                    </Text>
                  </Pressable>
                ) : null}
                {customer.email ? (
                  <Pressable onPress={handleEmailPress}>
                    <Text className="text-white/90 text-[13px] break-all">
                      ✉️ {customer.email}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden mt-2">
              <View className="flex-row items-center justify-between px-3 pt-2 pb-1.5">
                <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
                  Kartvizit
                </Text>
                {customer.cardImage ? (
                  <Pressable
                    onPress={handleDeleteCard}
                    disabled={updateCustomer.isPending}
                    className="p-1.5"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-[#F87171] text-[14px]">🗑</Text>
                  </Pressable>
                ) : null}
              </View>
              {customer.cardImage ? (
                <Image
                  source={{
                    uri: customer.cardImage.startsWith('http')
                      ? customer.cardImage
                      : `${getAssetBaseUrl()}${customer.cardImage}`,
                  }}
                  className="h-32 w-full"
                  resizeMode="contain"
                />
              ) : (
                <Pressable
                  onPress={onEdit}
                  className="rounded-lg border-2 border-dashed border-white/30 py-6 mx-3 mb-3 items-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white/60 text-[14px]">
                    📇 Kartvizit Ekle
                  </Text>
                </Pressable>
              )}
            </View>

            {hasProducts && (
              <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 mt-1">
                <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                  İlgilenilen Ürünler
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {displayProducts.map((p, i) => {
                    const line =
                      p.quantity != null && p.quantity > 0
                        ? `${p.productName} — ${formatTonnageLine(p.quantity, p.unit)}`
                        : p.productName;
                    return <Badge key={`${p.productName}-${i}`}>{line}</Badge>;
                  })}
                </View>
              </View>
            )}

            {stageLogs.length > 0 && (
              <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 mt-2">
                <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                  Aşama Geçmişi
                </Text>
                {stageLogs.map((log) => (
                  <Text
                    key={log.id}
                    className="text-white/80 text-[12px] mb-1"
                  >
                    {getStageLabel(log.stage)} —{' '}
                    {formatDateTime(log.createdAt)}
                  </Text>
                ))}
              </View>
            )}

            <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 mt-2">
              <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                Notlar
              </Text>
              {!showAddNote ? (
                <Pressable
                  onPress={() => setShowAddNote(true)}
                  className="rounded-lg border border-dashed border-white/30 py-2 items-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white/60 text-[13px]">+ Not ekle</Text>
                </Pressable>
              ) : (
                <View className="gap-2">
                  <TextInput
                    value={newNoteContent}
                    onChangeText={setNewNoteContent}
                    placeholder="Not içeriği..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white text-[13px] min-h-[60px]"
                    multiline
                    maxLength={5000}
                    editable={!createNote.isPending}
                  />
                  <View className="flex-row gap-2">
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setShowAddNote(false);
                        setNewNoteContent('');
                      }}
                      disabled={createNote.isPending}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      onPress={handleAddNote}
                      disabled={!newNoteContent.trim() || createNote.isPending}
                      className="flex-1"
                    >
                      {createNote.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </View>
                </View>
              )}
              {notes.length > 0 && (
                <View className="mt-3 gap-2">
                  {notes.map((note) => (
                    <View
                      key={note.id}
                      className="rounded-lg bg-white/5 px-3 py-2 border border-white/10"
                    >
                      {editingNoteId === note.id ? (
                        <View className="gap-2">
                          <TextInput
                            value={editingContent}
                            onChangeText={setEditingContent}
                            placeholder="Not içeriği..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white text-[13px] min-h-[50px]"
                            multiline
                            maxLength={5000}
                            editable={!updateNote.isPending}
                          />
                          <View className="flex-row gap-2">
                            <Button
                              variant="secondary"
                              onPress={() => {
                                setEditingNoteId(null);
                                setEditingContent('');
                              }}
                              disabled={updateNote.isPending}
                              className="flex-1"
                            >
                              İptal
                            </Button>
                            <Button
                              onPress={handleUpdateNote}
                              disabled={
                                !editingContent.trim() || updateNote.isPending
                              }
                              className="flex-1"
                            >
                              Kaydet
                            </Button>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text className="text-white text-[13px]">
                            {note.content}
                          </Text>
                          <Text className="text-white/50 text-[11px] mt-1">
                            {note.createdBy.name} —{' '}
                            {formatDateTime(note.createdAt)}
                          </Text>
                          {canEditNote(note) && (
                            <View className="flex-row gap-2 mt-2">
                              <Pressable
                                onPress={() => {
                                  setEditingNoteId(note.id);
                                  setEditingContent(note.content);
                                }}
                                className="px-2 py-1"
                              >
                                <Text className="text-white/70 text-[12px]">
                                  ✏️ Düzenle
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeleteNote(note.id)}
                                className="px-2 py-1"
                              >
                                <Text className="text-[#F87171] text-[12px]">
                                  🗑 Sil
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {hasOffer && (
              <Button
                variant="secondary"
                onPress={() => downloadOffer.mutate()}
                disabled={downloadOffer.isPending}
                className="mt-2"
              >
                {downloadOffer.isPending
                  ? 'İndiriliyor...'
                  : '📄 Teklif Dokümanını İndir'}
              </Button>
            )}
          </View>

          <View className="flex-row gap-2 mt-4">
            <Button onPress={onEdit} className="flex-1">
              ✏️ Düzenle
            </Button>
            <Button
              variant="danger"
              onPress={handleDeletePress}
              className="w-[100px]"
            >
              🗑 Sil
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
