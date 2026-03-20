import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CustomerListItem } from '@crm/shared';
import { formatDate } from '@crm/shared';
import { GradientView } from '@/components/ui/GradientView';

const CARD_TINTS = [
  ['rgba(139,92,246,0.22)', 'rgba(6,182,212,0.12)'],
  ['rgba(59,130,246,0.22)', 'rgba(6,182,212,0.12)'],
  ['rgba(236,72,153,0.2)', 'rgba(244,63,94,0.1)'],
  ['rgba(16,185,129,0.2)', 'rgba(20,184,166,0.1)'],
  ['rgba(245,158,11,0.2)', 'rgba(249,115,22,0.1)'],
] as const;

function tintForId(id: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return CARD_TINTS[Math.abs(hash) % CARD_TINTS.length];
}

interface CustomerListCardProps {
  customer: CustomerListItem;
  onPress: () => void;
}

/** FairCard ile aynı yapı: GradientView + içerik (FlatList satırında yükseklik çökmesini önler). */
export function CustomerListCard({ customer, onPress }: CustomerListCardProps) {
  const tint = tintForId(customer.id);

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-white/20 overflow-hidden active:opacity-90"
      style={{ width: '100%' }}
    >
      <GradientView
        colors={tint}
        direction="diagonal"
        style={{ padding: 16, width: '100%' }}
      >
        <View>
          <Text className="text-white text-lg font-semibold" numberOfLines={2}>
            {customer.company}
          </Text>
          <Text className="text-white/70 text-[14px] mt-1">{customer.name}</Text>
          <View className="mt-3">
            <LinearGradient
              colors={['rgba(249,115,22,0.25)', 'rgba(236,72,153,0.18)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: 'rgba(249,115,22,0.35)',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fb923c' }}>
                {customer.opportunityCount}
              </Text>
              <Text className="text-white/80 text-xs">fırsat</Text>
            </LinearGradient>
          </View>
          <Text className="text-white/60 text-[13px] mt-2">
            Son temas: {customer.lastContact ? formatDate(customer.lastContact) : '—'}
          </Text>
        </View>
      </GradientView>
    </Pressable>
  );
}
