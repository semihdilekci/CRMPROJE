'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFairDetail, useDeleteFair } from '@/hooks/use-fairs';
import { useCustomersByFair } from '@/hooks/use-customers';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { FairDetailHeader } from '@/components/fair/FairDetailHeader';
import { FairStats } from '@/components/fair/FairStats';
import { CustomerToolbar } from '@/components/fair/CustomerToolbar';
import { FairFormModal } from '@/components/fair/FairFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerCard } from '@/components/customer/CustomerCard';
import { CustomerFormModal } from '@/components/customer/CustomerFormModal';
import type { Customer } from '@crm/shared';

export default function FairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const fairId = params.id as string;

  const { data: fair, isLoading } = useFairDetail(fairId);
  const deleteFair = useDeleteFair();

  const [search, setSearch] = useState('');
  const [rateFilter, setRateFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers } = useCustomersByFair(fairId, search, rateFilter);

  const allCustomers = useMemo(() => fair?.customers ?? [], [fair?.customers]);

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

  const displayCustomers = customers ?? allCustomers;

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

        <FairStats customers={allCustomers} />

        <CustomerToolbar
          search={search}
          onSearchChange={setSearch}
          rateFilter={rateFilter}
          onRateFilterChange={setRateFilter}
          onAddCustomer={() => {
            setEditingCustomer(null);
            setShowCustomerModal(true);
          }}
        />

        {displayCustomers.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5">
            {displayCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                fairId={fairId}
                onEdit={() => {
                  setEditingCustomer(customer);
                  setShowCustomerModal(true);
                }}
              />
            ))}
          </div>
        ) : search || rateFilter ? (
          <p className="py-12 text-center text-muted">Arama sonucu bulunamadı.</p>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-[48px]">👥</span>
            <p className="mt-3 text-[14px] text-muted">
              Henüz müşteri eklenmemiş. Yukarıdaki butonu kullanarak müşteri ekleyin.
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
        message="Fuarı silmek istediğinizden emin misiniz? Bu işlem fuara ait tüm müşteri kayıtlarını da silecektir."
        loading={deleteFair.isPending}
      />

      <CustomerFormModal
        open={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
        fairId={fairId}
        initial={editingCustomer}
      />
    </div>
  );
}
