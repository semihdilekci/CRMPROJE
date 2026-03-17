import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Search, Sparkles, Menu } from 'lucide-react-native';
import { GradientView } from '@/components/ui/GradientView';

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showSearch?: boolean;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onBackPress?: () => void;
  rightContent?: ReactNode;
}

export function Header({
  title = 'EXPO CRM',
  showMenu = true,
  showSearch = true,
  onMenuPress,
  onSearchPress,
  onBackPress,
  rightContent,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 overflow-hidden"
      style={{ paddingTop: insets.top + 12 }}
    >
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <Pressable
        onPress={onBackPress ?? onMenuPress}
        className="p-2 -ml-2 z-10"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {onBackPress ? (
          <Text className="text-white text-2xl">←</Text>
        ) : (
          <Menu size={30} color="white" strokeWidth={2} />
        )}
      </Pressable>
      <View className="flex-row items-center gap-2 z-10">
        <GradientView
          direction="horizontal"
          style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <Sparkles size={18} color="white" strokeWidth={2} />
        </GradientView>
        <Text className="text-white text-lg font-semibold">{title}</Text>
      </View>
      <View className="z-10">
        {rightContent ?? (
          showSearch ? (
            <Pressable
              onPress={onSearchPress}
              className="p-2 -mr-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Search size={22} color="white" strokeWidth={2} />
            </Pressable>
          ) : (
            <View className="w-10" />
          )
        )}
      </View>
    </View>
  );
}
