'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFairs } from '@/hooks/use-fairs';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { FairCard } from '@/components/fair/FairCard';
import { FairFormModal } from '@/components/fair/FairFormModal';
import { Button } from '@/components/ui/Button';
import { useMyPermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth-store';
import { hasContentWriteAccess } from '@crm/shared';

export default function FairsPage() {
  const router = useRouter();
  const { data: fairs, isLoading } = useFairs();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const { data: permissions } = useMyPermissions();
  const isAdmin = user?.role === 'admin';
  const canWrite = isAdmin || hasContentWriteAccess(permissions?.permissions ?? []);

  const totalOpportunities = useMemo(
    () => fairs?.reduce((sum, f) => sum + ((f as any)._count?.opportunities ?? 0), 0) ?? 0,
    [fairs]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar showNewFairButton={canWrite} onNewFair={() => setShowCreateModal(true)} />
      <ContentWrapper>
        {fairs && fairs.length > 0 ? (
          <>
            <p className="mb-5 text-[14px] text-white/60">
              {fairs.length} fuar · {totalOpportunities} toplam fırsat
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fairs.map((fair) => (
                <FairCard
                  key={fair.id}
                  fair={fair}
                  onClick={() => router.push(`/fairs/${fair.id}`)}
                />
              ))}

              {canWrite && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex h-[240px] min-w-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/20 text-white/60 transition-all duration-300 hover:border-white/40 hover:text-white hover:bg-white/5"
                >
                  <span className="text-base font-medium">+ Yeni Fuar Ekle</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-[56px]">🏛</span>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Henüz fuar eklenmemiş
            </h2>
            <p className="mt-2 max-w-[320px] text-[14px] text-white/60">
              Fırsat kayıtlarını tutmak için ilk fuarınızı oluşturun
            </p>
            {canWrite && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-6"
              >
                + İlk Fuarı Oluştur
              </Button>
            )}
          </div>
        )}
      </ContentWrapper>

      {canWrite && (
        <FairFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
