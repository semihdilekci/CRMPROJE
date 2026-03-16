import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { useNavigation } from 'expo-router';

export default function FairDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#020617]">
      <Header
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
        onBackPress={router.back}
        title="Fuar Detay"
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white/60">Fuar ID: {id}</Text>
        <Text className="text-white/60 mt-2 text-center">
          Fuar detay sayfası M9'da tamamlanacak
        </Text>
      </View>
    </View>
  );
}
