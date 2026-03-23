import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChatMessage } from './ChatMessage';
import { useChatQuery } from '@/hooks/use-chat';
import { useAuthStore } from '@/stores/auth-store';
import { Dropdown } from '@/components/ui/Dropdown';
import { GradientView } from '@/components/ui/GradientView';
import { getApiErrorMessage, type ChartData, type TableData, type OllamaModel } from '@crm/shared';

function LoadingDots() {
  const [anims] = useState(() =>
    [0, 1, 2].map(() => new Animated.Value(0))
  );

  useEffect(() => {
    const animate = (index: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anims[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anims[index], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    anims.forEach((_, i) => animate(i));
  }, [anims]);

  return (
    <View className="flex-row items-center gap-0.5 ml-1">
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'white',
            opacity: a.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
          }}
        />
      ))}
    </View>
  );
}

interface ChatSendButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}

function ChatSendButton({ onPress, disabled, loading }: ChatSendButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`overflow-hidden shrink-0 ${disabled ? 'opacity-50' : ''}`}
      style={{
        minWidth: 100,
        borderRadius: 12,
      }}
    >
      <GradientView
        direction="horizontal"
        style={{
          minHeight: 44,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        }}
      >
        <Text className="text-[14px] font-semibold text-white">Gönder</Text>
        {loading && <LoadingDots />}
      </GradientView>
    </Pressable>
  );
}

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

const MODEL_OPTIONS = [
  { value: 'claude' as const, label: 'Claude (Bulut)' },
  { value: 'gemini' as const, label: 'Gemini (Bulut)' },
  { value: 'qwen2.5-coder:7b' as OllamaModel, label: 'Ollama Qwen 7B (Yerel)' },
  { value: 'qwen2.5-coder:14b' as OllamaModel, label: 'Ollama Qwen 14B (Yerel)' },
];

export function ChatPanel() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<'ollama' | 'claude' | 'gemini'>('ollama');
  const [ollamaModel, setOllamaModel] = useState<OllamaModel>('qwen2.5-coder:7b');
  const scrollRef = useRef<ScrollView>(null);
  const chatQuery = useChatQuery();

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, chatQuery.isPending]);

  const handleSubmit = async () => {
    const msg = input.trim();
    if (!msg || chatQuery.isPending) return;

    const userMessage: MessageItem = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const recentMessages = [...messages, userMessage]
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await chatQuery.mutateAsync({
        message: msg,
        messages: recentMessages,
        provider,
        ...(provider === 'ollama' && { ollamaModel }),
      });

      const assistantMessage: MessageItem = {
        role: 'assistant',
        content: result.text,
        charts: result.charts,
        tables: result.tables,
        exportId: result.exportId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
          },
        ]);
        await logout();
        router.replace('/(auth)/login');
        return;
      }

      const errorText = getApiErrorMessage(
        err,
        'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorText },
      ]);
    }
  };

  const currentModelValue =
    provider === 'ollama' ? ollamaModel : provider;
  const handleModelChange = (v: string) => {
    if (v === 'claude') {
      setProvider('claude');
    } else if (v === 'gemini') {
      setProvider('gemini');
    } else {
      setProvider('ollama');
      setOllamaModel(v as OllamaModel);
    }
  };

  const insets = useSafeAreaInsets();
  const tabBarHeight = 45 + insets.bottom;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <View className="flex-1" style={{ paddingBottom: tabBarHeight }}>
        <View className="border-b border-white/10 px-4 py-3">
          <View className="flex-row items-center justify-between gap-3 flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <Text className="text-white text-lg font-semibold">
                AI Analiz Asistanı
              </Text>
              <Text className="text-white/60 text-[13px] mt-0.5">
                Fuar ve müşteri verilerinizi sorarak analiz edin.
              </Text>
            </View>
            <View className="w-[180px]">
              <Dropdown
                value={currentModelValue}
                options={MODEL_OPTIONS}
                onSelect={handleModelChange}
                placeholder="Model"
              />
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 py-3"
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 && !chatQuery.isPending && (
            <View className="py-12 items-center">
              <Text className="text-white/60 text-[14px] text-center">
                Bir soru yazın. Örn: &quot;Fuarlarımın fırsat dağılımı nasıl?&quot;
              </Text>
            </View>
          )}
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              charts={m.charts}
              tables={m.tables}
              exportId={m.exportId}
            />
          ))}
          {chatQuery.isPending && (
            <View className="py-6 items-center flex-row justify-center gap-2">
              <Text className="text-white/60 text-[14px]">Analiz Hazırlanıyor</Text>
              <View className="flex-row gap-1">
                <View className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <View className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <View className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              </View>
            </View>
          )}
        </ScrollView>

        <View className="border-t border-white/10 px-4 py-2">
          <View className="flex-row items-center gap-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Analiz etmek istediğiniz soruyu yazın..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              maxLength={4000}
              editable={!chatQuery.isPending}
              className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white text-[14px]"
              style={{ textAlignVertical: 'top' }}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <ChatSendButton
              onPress={handleSubmit}
              disabled={!input.trim() || chatQuery.isPending}
              loading={chatQuery.isPending}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
