'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFairDetail, useDeleteFair } from '@/hooks/use-fairs';
import { useOpportunitiesByFair } from '@/hooks/use-opportunities';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { FairDetailHeader } from '@/components/fair/FairDetailHeader';
import { FairStats } from '@/components/fair/FairStats';
import { OpportunityToolbar } from '@/components/fair/OpportunityToolbar';
import { FairFormModal } from '@/components/fair/FairFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OpportunityCard } from '@/components/opportunity/OpportunityCard';
import { OpportunityFormModal } from '@/components/opportunity/OpportunityFormModal';
import type { OpportunityWithCustomer } from '@crm/shared';

export default function FairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const fairId = params.id as string;

  const { data: fair, isLoading } = useFairDetail(fairId);
  const deleteFair = useDeleteFair();

  const [search, setSearch] = useState('');
  const [rateFilter, setRateFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityWithCustomer | null>(null);

  const { data: opportunities } = useOpportunitiesByFair(
    fairId,
    search,
    rateFilter,
    stageFilter,
  );

  const allOpportunities = useMemo(
    () => fair?.opportunities ?? [],
    [fair?.opportunities],
  );

  const handleDeleteFair = async () => {
    await deleteFair.mutateAsync(fairId);
    router.replace('/fairs');
  };

  if (isLoading || !fair) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-muted text-lg">Yükleniyor...</p>
      </div>
    );
  }

  const displayOpportunities = opportunities ?? allOpportunities;

  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb={fair.name} />
      <ContentWrapper>
        <button
          onClick={() => router.push('/fairs')}
          className="mb-4 cursor-pointer text-[14px] text-muted transition-colors hover:text-text"
        >
          ← Fuarlara Dön
        </button>

        <FairDetailHeader
          fair={fair}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => setShowDeleteDialog(true)}
        />

        <FairStats opportunities={allOpportunities} />

        <OpportunityToolbar
          search={search}
          onSearchChange={setSearch}
          rateFilter={rateFilter}
          onRateFilterChange={setRateFilter}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          onAddOpportunity={() => {
            setEditingOpportunity(null);
            setShowOpportunityModal(true);
          }}
        />

        {displayOpportunities.length > 0 ? (
          <div className="columns-1 gap-2.5 sm:columns-2">
            {displayOpportunities.map((opp) => (
              <div key={opp.id} className="mb-2.5 break-inside-avoid">
                <OpportunityCard
                  opportunity={opp}
                  fairId={fairId}
                  onEdit={() => {
                    setEditingOpportunity(opp);
                    setShowOpportunityModal(true);
                  }}
                />
              </div>
            ))}
            <div className="mb-2.5 break-inside-avoid">
              <button
                type="button"
                onClick={() => {
                  setEditingOpportunity(null);
                  setShowOpportunityModal(true);
                }}
                className="flex min-h-[110px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border p-4 text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                <span className="text-[15px] font-medium">+ Yeni Fırsat Ekle</span>
              </button>
            </div>
          </div>
        ) : search || rateFilter || stageFilter ? (
          <p className="py-12 text-center text-muted">Arama sonucu bulunamadı.</p>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-[48px]">💼</span>
            <p className="mt-3 text-[14px] text-muted">
              Henüz fırsat eklenmemiş. Yukarıdaki butonu kullanarak fırsat ekleyin.
            </p>
          </div>
        )}
      </ContentWrapper>

      <FairFormModal open={showEditModal} onClose={() => setShowEditModal(false)} initial={fair} />

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteFair}
        title="Fuarı Sil"
        message="Fuarı silmek istediğinizden emin misiniz? Bu işlem fuara ait tüm fırsat kayıtlarını da silecektir."
        loading={deleteFair.isPending}
      />

      <OpportunityFormModal
        open={showOpportunityModal}
        onClose={() => {
          setShowOpportunityModal(false);
          setEditingOpportunity(null);
        }}
        fairId={fairId}
        initial={editingOpportunity}
      />
    </div>
  );
}
