import { View, Text, Pressable } from 'react-native';
import { GradientView } from '@/components/ui/GradientView';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useFairFormStore } from '@/stores/fair-form-store';

export default function AddScreen() {
  const openFairForm = useFairFormStore((s) => s.open);

  return (
    <GradientBackground>
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-white/60 text-center mb-6">
        Yeni fuar veya fırsat ekleyin
      </Text>
      <Pressable
        onPress={openFairForm}
        className="rounded-lg overflow-hidden"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <GradientView
          direction="horizontal"
          style={{ paddingHorizontal: 32, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-white font-semibold text-lg" style={{ textAlign: 'center' }}>Yeni Fuar Ekle</Text>
        </GradientView>
      </Pressable>
    </View>
    </GradientBackground>
  );
}
