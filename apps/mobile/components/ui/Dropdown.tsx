import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string = string> {
  value: T;
  options: DropdownOption<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown<T extends string = string>({
  value,
  options,
  onSelect,
  placeholder = 'Seçin',
  className = '',
}: DropdownProps<T>) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder;

  const handleSelect = (v: T) => {
    onSelect(v);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className={`flex-row items-center justify-between rounded-lg border border-white/20 bg-white/5 px-2 py-2 min-h-[40px] ${className}`}
      >
        <Text
          className="text-white text-[13px] flex-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
        <Text className="text-white/60 text-[10px] ml-1">▼</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setVisible(false)}
        >
          <Pressable
            className="bg-[#12121A] rounded-t-2xl border-t border-white/10 max-h-[50%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="h-1 w-12 bg-white/30 rounded-full self-center mt-2 mb-2" />
            <ScrollView
              className="max-h-[300px]"
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value as T)}
                  className={`px-4 py-3 border-b border-white/10 ${
                    value === opt.value ? 'bg-[#8b5cf6]/20' : ''
                  }`}
                >
                  <Text className="text-white text-[14px]">{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
