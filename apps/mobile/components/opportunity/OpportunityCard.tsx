import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Linking,
  Alert,
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
  onOfferDownload?: () => void;
}

export function OpportunityCard({
  opportunity,
  fairId,
  onEdit,
  onStageChange,
  onOfferDownload,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const deleteOpportunity = useDeleteOpportunity(fairId);
  const { data: stageLogs = [] } = useStageHistory(opportunity.id, {
    enabled: expanded,
  });

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

  return (
    <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden mb-2">
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center justify-between p-4 min-h-[100px]"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="flex-1 min-w-0">
          <Text className="text-white font-bold text-[15px]">{customer.name}</Text>
          <Text className="text-white/80 font-semibold text-[13px] mt-0.5">
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

            {onOfferDownload && (
              <Button variant="secondary" onPress={onOfferDownload} className="mt-2">
                📄 Teklif İndir
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
