import { View, Text } from 'react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function ChatScreen() {
  return (
    <GradientBackground>
    <View className="flex-1 items-center justify-center">
      <Text className="text-white text-xl">AI Analiz</Text>
      <Text className="text-white/60 mt-2">Chat</Text>
    </View>
    </GradientBackground>
  );
}
