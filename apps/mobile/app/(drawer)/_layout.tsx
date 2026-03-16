import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '@/components/layout/DrawerContent';
import { FairForm } from '@/components/fair/FairForm';
import { OpportunityForm } from '@/components/opportunity/OpportunityForm';
import { useAuthStore } from '@/stores/auth-store';
import { useFairFormStore } from '@/stores/fair-form-store';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';

export default function DrawerLayout() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const { visible, close, editingFair } = useFairFormStore();
  const {
    visible: oppVisible,
    close: oppClose,
    fairId: oppFairId,
    editingOpportunity: oppEditing,
  } = useOpportunityFormStore();
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
        sceneContainerStyle: { backgroundColor: 'transparent' },
        drawerActiveTintColor: '#8b5cf6',
        drawerInactiveTintColor: 'rgba(255,255,255,0.6)',
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Ana Sayfa' }} />
    </Drawer>
    <FairForm visible={visible} onClose={close} initial={editingFair ?? undefined} />
    <OpportunityForm
      visible={oppVisible}
      fairId={oppFairId}
      initial={oppEditing ?? undefined}
      onClose={oppClose}
    />
    </>
  );
}
