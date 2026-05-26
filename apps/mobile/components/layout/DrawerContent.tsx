import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { FeedbackCategory } from '@crm/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubmitFeedback } from '@/hooks/use-feedback';
import { Button } from '@/components/ui/Button';

const CATEGORY_OPTIONS: { type: FeedbackCategory; label: string; emoji: string }[] = [
  { type: 'idea', label: 'Yeni fikir / öneri', emoji: '💡' },
  { type: 'bug', label: 'Hata bildir', emoji: '🐛' },
  { type: 'question', label: 'Soru sor', emoji: '❓' },
];

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  idea: 'Yeni fikir / öneri',
  bug: 'Hata bildirimi',
  question: 'Soru',
};

function getApiErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data &&
    typeof err.response.data.message === 'string'
  ) {
    return err.response.data.message;
  }
  return 'Geri bildirim gönderilemedi. Lütfen tekrar deneyin.';
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const submit = useSubmitFeedback();

  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  const resetCompose = useCallback(() => {
    setCategory(null);
    setMessage('');
    setFieldError(null);
    setSuccess(false);
    submit.reset();
  }, [submit]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetCompose();
  }, [resetCompose]);

  const openCategory = (type: FeedbackCategory) => {
    setCategory(type);
    setFieldError(null);
    setSuccess(false);
    setModalVisible(true);
  };

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => closeModal(), 1800);
    return () => clearTimeout(timer);
  }, [success, closeModal]);

  const handleSubmit = async () => {
    if (!category) return;
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setFieldError('Mesaj en az 10 karakter olmalıdır');
      return;
    }
    setFieldError(null);
    try {
      await submit.mutateAsync({ category, message: trimmed });
      setSuccess(true);
    } catch (err: unknown) {
      setFieldError(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
        <View className="flex-1 bg-[#020617] pt-12 px-4">
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-12 h-12 rounded-full bg-[#8b5cf6] items-center justify-center">
              <Text className="text-white text-lg font-semibold">{initials}</Text>
            </View>
            <View>
              <Text className="text-white text-base font-semibold">{user?.name || 'Kullanıcı'}</Text>
              <Text className="text-white/60 text-sm">
                {user?.role === 'admin' ? 'Yönetici' : 'Satış'}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-white/20 bg-white/10 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-violet-500">
                <Text className="text-sm">💡</Text>
              </View>
              <Text className="text-white text-sm font-medium">Öneride bulun</Text>
            </View>
            <Text className="text-white/55 text-xs leading-snug mb-3">
              Fikrini, talebini ya da karşılaştığın bir sorunu paylaş.
            </Text>
            {CATEGORY_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.type}
                onPress={() => openCategory(opt.type)}
                className={`mt-2 flex-row items-center gap-2 rounded-lg border px-3 py-2.5 ${
                  i === 0
                    ? 'border-violet-500/30 bg-violet-500/10'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <Text className="text-base">{opt.emoji}</Text>
                <Text
                  className={`text-[13px] ${i === 0 ? 'text-violet-200' : 'text-white/70'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-1" />
          <Pressable
            onPress={() => {
              navigation.closeDrawer();
              logout();
            }}
            className="py-3 border-t border-white/10"
          >
            <Text className="text-white/60">Çıkış Yap</Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 justify-end bg-black/60" onPress={closeModal}>
            <Pressable
              className="bg-[#12121A] rounded-t-2xl border-t border-white/10"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="h-1 w-12 bg-white/30 rounded-full self-center mt-2 mb-2" />
              <View
                className="px-4 pb-6"
                style={{ paddingBottom: Math.max(24, insets.bottom) }}
              >
                {success ? (
                  <Text className="py-8 text-center text-sm text-green-400">
                    Teşekkürler! Geri bildiriminiz alındı.
                  </Text>
                ) : (
                  <>
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-white/70 text-sm flex-1">
                        <Text className="text-white/40">Kategori: </Text>
                        {category ? CATEGORY_LABEL[category] : ''}
                      </Text>
                      <Pressable onPress={closeModal} className="p-2">
                        <Text className="text-white/60 text-lg">✕</Text>
                      </Pressable>
                    </View>
                    <Text className="text-white/80 text-sm mb-2">Mesajınız</Text>
                    <TextInput
                      className="min-h-[120px] rounded-lg border border-white/20 bg-white/5 px-3 py-3 text-white text-sm"
                      placeholder="Detayları yazın…"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={message}
                      onChangeText={(text) => {
                        setMessage(text);
                        if (fieldError) setFieldError(null);
                      }}
                      multiline
                      textAlignVertical="top"
                      maxLength={5000}
                    />
                    {fieldError ? (
                      <Text className="text-[#F87171] text-xs mt-2">{fieldError}</Text>
                    ) : null}
                    <View className="flex-row justify-end gap-2 mt-4">
                      <Button variant="secondary" onPress={closeModal}>
                        İptal
                      </Button>
                      <Button onPress={handleSubmit} disabled={submit.isPending}>
                        {submit.isPending ? 'Gönderiliyor…' : 'Gönder'}
                      </Button>
                    </View>
                  </>
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
