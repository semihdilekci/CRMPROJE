'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFairs } from '@/hooks/use-fairs';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { FairCard } from '@/components/fair/FairCard';
import { FairFormModal } from '@/components/fair/FairFormModal';

export default function FairsPage() {
  const router = useRouter();
  const { data: fairs, isLoading } = useFairs();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalCustomers = useMemo(
    () => fairs?.reduce((sum, f) => sum + ((f as any)._count?.customers ?? 0), 0) ?? 0,
    [fairs]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-muted text-lg">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopBar showNewFairButton onNewFair={() => setShowCreateModal(true)} />
      <ContentWrapper>
        {fairs && fairs.length > 0 ? (
          <>
            <p className="mb-5 text-[14px] text-muted">
              {fairs.length} fuar · {totalCustomers} toplam müşteri kaydı
            </p>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
              {fairs.map((fair) => (
                <FairCard
                  key={fair.id}
                  fair={fair}
                  onClick={() => router.push(`/fairs/${fair.id}`)}
                />
              ))}

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex min-h-[160px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                <span className="text-[15px] font-medium">+ Yeni Fuar Ekle</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-[56px]">🏛</span>
            <h2 className="mt-4 font-serif text-[22px] font-semibold text-text">
              Henüz fuar eklenmemiş
            </h2>
            <p className="mt-2 max-w-[320px] text-[14px] text-muted">
              Müşteri kayıtlarını tutmak için ilk fuarınızı oluşturun
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 cursor-pointer rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
            >
              + İlk Fuarı Oluştur
            </button>
          </div>
        )}
      </ContentWrapper>

      <FairFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
