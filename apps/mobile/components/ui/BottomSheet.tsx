import { type ReactNode } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isVisible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/60"
        onPress={onClose}
      >
        <Pressable
          className="bg-[#12121A] rounded-t-2xl border-t border-white/10 max-h-[90%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="h-1 w-12 bg-white/30 rounded-full self-center mt-2 mb-2" />
          <View className="flex-row items-center justify-between px-4 pb-4">
            <Text className="text-white text-xl font-semibold">{title}</Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-white/60 text-lg">✕</Text>
            </Pressable>
          </View>
          <View className="px-4 pb-6">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
