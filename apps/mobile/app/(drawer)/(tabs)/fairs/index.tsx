import { View, Text } from 'react-native';
import { Header } from '@/components/layout/Header';
import { useNavigation } from 'expo-router';

export default function FairsScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#020617]">
      <Header
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-xl">Fuarlar</Text>
        <Text className="text-white/60 mt-2">Fuar CRM Mobil</Text>
      </View>
    </View>
  );
}
