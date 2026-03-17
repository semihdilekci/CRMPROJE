import { type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isVisible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        >
          <Pressable
            className="bg-[#12121A] rounded-t-2xl border-t border-white/10 max-h-[90%]"
            onPress={(e) => {
              e.stopPropagation();
              Keyboard.dismiss();
            }}
          >
            <View className="h-1 w-12 bg-white/30 rounded-full self-center mt-2 mb-2" />
            <View className="flex-row items-center justify-between px-4 pb-4">
              <Text className="text-white text-xl font-semibold">{title}</Text>
              <Pressable onPress={onClose} className="p-2">
                <Text className="text-white/60 text-lg">✕</Text>
              </Pressable>
            </View>
            <View
              className="px-4 pb-6"
              style={{ paddingBottom: Math.max(24, insets.bottom) }}
            >
              {children}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
