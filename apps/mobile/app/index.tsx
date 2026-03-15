import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate().then(() => setReady(true));
  }, [hydrate]);

  if (!ready || isLoading) {
    return (
      <View className="flex-1 bg-[#020617] items-center justify-center">
        <Text className="text-white/60">Yükleniyor...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(drawer)/(tabs)/fairs" />;
}
