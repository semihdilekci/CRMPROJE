import { View, Text, Pressable } from 'react-native';
import { useFairFormStore } from '@/stores/fair-form-store';

export default function AddScreen() {
  const openFairForm = useFairFormStore((s) => s.open);

  return (
    <View className="flex-1 bg-[#020617] items-center justify-center px-6">
      <Text className="text-white/60 text-center mb-6">
        Yeni fuar veya fırsat ekleyin
      </Text>
      <Pressable
        onPress={openFairForm}
        className="rounded-lg bg-[#8b5cf6] px-8 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white font-semibold text-lg">Yeni Fuar Ekle</Text>
      </Pressable>
    </View>
  );
}
