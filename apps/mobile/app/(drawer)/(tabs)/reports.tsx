import { View, Text } from 'react-native';
import { useNavigation } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function ReportsScreen() {
  const navigation = useNavigation();

  return (
    <GradientBackground>
      <Header
        showSearch={false}
        title="Raporlar"
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="text-white text-2xl font-semibold text-center">Raporlar</Text>
        <Text className="text-white/50 text-sm text-center mt-4 max-w-sm">
          Raporlama modülü yakında aktif olacak. Fuar bazlı analitik ve müşteri performans
          raporları burada görüntülenecek.
        </Text>
      </View>
    </GradientBackground>
  );
}
