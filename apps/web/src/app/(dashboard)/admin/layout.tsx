'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.replace('/fairs');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
