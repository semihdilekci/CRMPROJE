import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function Index() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate().then(() => setReady(true));
  }, [hydrate]);

  if (!ready || isLoading) {
    return (
      <GradientBackground>
      <View className="flex-1 items-center justify-center">
        <Text className="text-white/60">Yükleniyor...</Text>
      </View>
      </GradientBackground>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(drawer)/(tabs)/fairs" />;
}
