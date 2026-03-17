import { useNavigation } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ChatScreen() {
  const navigation = useNavigation();

  return (
    <GradientBackground>
      <Header
        showSearch={false}
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <ChatPanel />
    </GradientBackground>
  );
}
