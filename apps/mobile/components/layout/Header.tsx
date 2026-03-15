import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showSearch?: boolean;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
}

export function Header({
  title = 'Fuar CRM',
  showMenu = true,
  showSearch = true,
  onMenuPress,
  onSearchPress,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 bg-[#020617]/95">
      <Pressable
        onPress={onMenuPress}
        className="p-2 -ml-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="text-white text-xl">☰</Text>
      </Pressable>
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 rounded-lg bg-[#8b5cf6] items-center justify-center">
          <Text className="text-white text-sm">★</Text>
        </View>
        <Text className="text-white text-lg font-semibold">{title}</Text>
      </View>
      <Pressable
        onPress={onSearchPress}
        className="p-2 -mr-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="text-white text-xl">🔍</Text>
      </Pressable>
    </View>
  );
}
