import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { usePermissions, useHasPermission } from '@/hooks/use-permissions';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { isLoading } = usePermissions();
  const hasChat = useHasPermission('ai_analyst');

  const handleMenu = () => {
    (navigation as { openDrawer?: () => void }).openDrawer?.();
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <Header showSearch={false} onMenuPress={handleMenu} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8b5cf6" />
        </View>
      </GradientBackground>
    );
  }

  if (!hasChat) {
    return (
      <GradientBackground>
        <Header showSearch={false} onMenuPress={handleMenu} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">🤖</Text>
          <Text className="text-white text-lg font-semibold text-center">Erişim Kısıtlı</Text>
          <Text className="text-white/50 text-sm text-center mt-2">
            AI Analiz özelliğine erişim yetkiniz bulunmamaktadır.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header showSearch={false} onMenuPress={handleMenu} />
      <ChatPanel />
    </GradientBackground>
  );
}
