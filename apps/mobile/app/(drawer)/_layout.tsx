import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '@/components/layout/DrawerContent';
import { FairForm } from '@/components/fair/FairForm';
import { useAuthStore } from '@/stores/auth-store';
import { useFairFormStore } from '@/stores/fair-form-store';

export default function DrawerLayout() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const { visible, close, editingFair } = useFairFormStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <>
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#020617' },
        drawerActiveTintColor: '#8b5cf6',
        drawerInactiveTintColor: 'rgba(255,255,255,0.6)',
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Ana Sayfa' }} />
    </Drawer>
    <FairForm visible={visible} onClose={close} initial={editingFair ?? undefined} />
    </>
  );
}
