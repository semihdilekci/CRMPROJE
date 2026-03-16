import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Header } from '@/components/layout/Header';
import { GradientView } from '@/components/ui/GradientView';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useNavigation } from 'expo-router';
import { useFairs } from '@/hooks/use-fairs';
import { FairCard } from '@/components/fair/FairCard';
import { useFairFormStore } from '@/stores/fair-form-store';

export default function FairsScreen() {
  const navigation = useNavigation();
  const openFairForm = useFairFormStore((s) => s.open);
  const { data: fairs, isLoading, error } = useFairs();

  const totalOpportunities = fairs?.reduce(
    (sum, f) => sum + (f._count?.opportunities ?? 0),
    0
  ) ?? 0;
  const fairCount = fairs?.length ?? 0;

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text className="text-5xl mb-4">🏛</Text>
      <Text className="text-white text-xl font-semibold text-center">
        Henüz fuar yok
      </Text>
      <Text className="text-white/60 text-center mt-2">
        Yeni bir fuar ekleyerek başlayın
      </Text>
      <Pressable
        onPress={openFairForm}
        className="mt-6 rounded-lg overflow-hidden"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <GradientView
          direction="horizontal"
          style={{ paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-white font-semibold" style={{ textAlign: 'center' }}>Yeni Fuar Ekle</Text>
        </GradientView>
      </Pressable>
    </View>
  );

  const renderHeader = () => (
    <View className="px-4 pb-3">
      <Text className="text-white/60 text-sm">
        {fairCount} fuar · {totalOpportunities} toplam fırsat
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <Header
          onMenuPress={() => {
            (navigation as { openDrawer?: () => void }).openDrawer?.();
          }}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="text-white/60 mt-3">Yükleniyor...</Text>
        </View>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <Header
          onMenuPress={() => {
            (navigation as { openDrawer?: () => void }).openDrawer?.();
          }}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[#F87171] text-center">
            Fuarlar yüklenirken hata oluştu
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <FlatList
        data={fairs ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FairCard fair={item} />}
        ListHeaderComponent={fairs && fairs.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
          flexGrow: 1,
        }}
        style={{ backgroundColor: 'transparent' }}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </GradientBackground>
  );
}
