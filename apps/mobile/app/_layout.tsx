import '../global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Design system: mor glow (sol üst) + turkuaz glow (sağ alt) + koyu taban
const backgroundGradient = [
  '#312e81',  // indigo-900 — mor glow sol üst
  '#0f0a1a', // mor tonlu koyu
  '#030712',  // gray-950 — koyu taban
  '#0f172a',  // slate-900
  '#164e63',  // cyan-800 — turkuaz glow sağ alt
] as const;

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient
          colors={backgroundGradient}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </SafeAreaProvider>
        </LinearGradient>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
