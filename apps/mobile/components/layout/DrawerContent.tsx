import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const { navigation } = props;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
    <View className="flex-1 bg-[#020617] pt-12 px-4">
      <View className="flex-row items-center gap-3 mb-8">
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
      <Pressable className="flex-row items-center gap-3 py-3">
        <Text className="text-xl">🔔</Text>
        <Text className="text-white">Bildirimler</Text>
        <View className="ml-auto bg-[#F87171] rounded-full min-w-[20px] h-5 items-center justify-center px-1">
          <Text className="text-white text-xs font-semibold">3</Text>
        </View>
      </Pressable>
      <Pressable className="flex-row items-center gap-3 py-3">
        <Text className="text-xl">⚙️</Text>
        <Text className="text-white">Ayarlar</Text>
      </Pressable>
      <Pressable className="flex-row items-center gap-3 py-3">
        <Text className="text-xl">❓</Text>
        <Text className="text-white">Yardım</Text>
      </Pressable>
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
  );
}
