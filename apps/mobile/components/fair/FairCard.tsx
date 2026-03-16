import { Pressable, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientView } from '@/components/ui/GradientView';
import { MapPinIcon } from '@/components/ui/MapPinIcon';
import { CalendarIcon } from '@/components/ui/CalendarIcon';
import { theme } from '@/constants/theme';
import type { Fair } from '@crm/shared';
import { formatDate } from '@crm/shared';
import { useFairFormStore } from '@/stores/fair-form-store';
import { useDeleteFair } from '@/hooks/use-fairs';

export type FairWithCount = Fair & { _count?: { opportunities: number } };

interface FairCardProps {
  fair: FairWithCount;
}

export function FairCard({ fair }: FairCardProps) {
  const router = useRouter();
  const openEdit = useFairFormStore((s) => s.openEdit);
  const deleteFair = useDeleteFair();
  const now = new Date();
  const start = new Date(fair.startDate);
  const end = new Date(fair.endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;
  const opportunityCount = fair._count?.opportunities ?? 0;

  const handlePress = () => {
    router.push(`/(drawer)/(tabs)/fairs/${fair.id}`);
  };

  const handleLongPress = () => {
    Alert.alert(
      fair.name,
      'Fuarı düzenle veya sil',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Düzenle', onPress: () => openEdit(fair) },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Fuarı Sil',
              `"${fair.name}" fuarı ve tüm fırsatları silinecek. Emin misiniz?`,
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Sil',
                  style: 'destructive',
                  onPress: () => deleteFair.mutate(fair.id),
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="rounded-2xl border border-white/20 overflow-hidden active:opacity-90"
    >
      <GradientView
        colors={theme.gradients.glass}
        direction="diagonal"
        style={{ padding: 16 }}
      >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-lg font-semibold" numberOfLines={2}>
            {fair.name}
          </Text>
          <View className="flex-row items-start gap-1.5 mt-1">
            <MapPinIcon size={14} color="#a78bfa" />
            <Text className="text-white/70 text-[13px] flex-1" numberOfLines={2}>
              {fair.address}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 mt-1">
            <CalendarIcon size={14} color="#22d3ee" />
            <Text
              className={`text-[13px] flex-1 ${isPast ? 'text-white/50' : 'text-white/70'}`}
              numberOfLines={1}
            >
              {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
            </Text>
          </View>
        </View>
        {isActive && (
          <View className="rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-green-400">DEVAM</Text>
          </View>
        )}
      </View>
      <View className="mt-3">
        <LinearGradient
          colors={['rgba(249,115,22,0.2)', 'rgba(236,72,153,0.2)']}
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
            borderColor: 'rgba(249,115,22,0.3)',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fb923c' }}>
            {opportunityCount}
          </Text>
          <Text className="text-white/80 text-xs">fırsat</Text>
        </LinearGradient>
      </View>
      </GradientView>
    </Pressable>
  );
}
