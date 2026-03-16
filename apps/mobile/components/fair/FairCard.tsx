import { Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { Fair } from '@crm/shared';
import { formatDate } from '@crm/shared';

export type FairWithCount = Fair & { _count?: { opportunities: number } };

interface FairCardProps {
  fair: FairWithCount;
}

export function FairCard({ fair }: FairCardProps) {
  const router = useRouter();
  const now = new Date();
  const start = new Date(fair.startDate);
  const end = new Date(fair.endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;
  const opportunityCount = fair._count?.opportunities ?? 0;

  const handlePress = () => {
    router.push(`/(drawer)/(tabs)/fairs/${fair.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-2xl border border-white/20 bg-white/5 p-4 active:opacity-90"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-lg font-semibold" numberOfLines={2}>
            {fair.name}
          </Text>
          <Text className="text-white/70 text-[13px] mt-1" numberOfLines={2}>
            📍 {fair.address}
          </Text>
          <Text
            className={`text-[13px] mt-1 ${isPast ? 'text-white/50' : 'text-white/70'}`}
            numberOfLines={1}
          >
            📅 {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
          </Text>
        </View>
        {isActive && (
          <View className="rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-green-400">DEVAM</Text>
          </View>
        )}
      </View>
      <View className="mt-3">
        <View className="self-start rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 flex-row items-baseline gap-1">
          <Text className="text-white font-bold text-base">{opportunityCount}</Text>
          <Text className="text-white/80 text-[12px]">fırsat</Text>
        </View>
      </View>
    </Pressable>
  );
}
