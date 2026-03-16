import { View, Text } from 'react-native';
import { formatDate } from '@crm/shared';
import { MapPinIcon } from '@/components/ui/MapPinIcon';
import { CalendarIcon } from '@/components/ui/CalendarIcon';
import type { Fair } from '@crm/shared';

interface FairDetailHeaderProps {
  fair: Fair;
}

export function FairDetailHeader({ fair }: FairDetailHeaderProps) {
  return (
    <View className="px-4 pt-4 pb-5 gap-3">
      <View className="flex-row items-start gap-2">
        <View className="pt-0.5">
          <MapPinIcon size={14} color="#a78bfa" />
        </View>
        <Text className="text-white/70 text-[13px] flex-1 leading-5">
          {fair.address || 'Adres belirtilmemiş'}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <CalendarIcon size={14} color="#22d3ee" />
        <Text className="text-white/70 text-[13px]">
          {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
        </Text>
      </View>
    </View>
  );
}
