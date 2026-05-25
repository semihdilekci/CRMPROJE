'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasContentWriteAccess, type CustomerListSortBy } from '@crm/shared';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCustomerList } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { useMyPermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth-store';
import { CustomerListCard } from '@/components/customer/CustomerListCard';
import { CustomerCreateModal } from '@/components/customer/CustomerCreateModal';

const SORT_OPTIONS: Array<{ value: CustomerListSortBy; label: string }> = [
  { value: 'lastContact', label: 'Son Temas' },
  { value: 'company', label: 'Firma Adı' },
  { value: 'opportunityCount', label: 'Fırsat Sayısı' },
];

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CustomerListSortBy>('lastContact');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { data: customers = [], isLoading } = useCustomerList(debouncedSearch || undefined, sortBy);

  const user = useAuthStore((s) => s.user);
  const { data: permissions } = useMyPermissions();
  const isAdmin = user?.role === 'admin';
  const canWrite = isAdmin || hasContentWriteAccess(permissions?.permissions ?? []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <ContentWrapper>
        <h1
          className="text-3xl font-bold text-[#f0ede8]"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Müşteriler
        </h1>
        <p className="mt-2 text-sm text-[#f0ede8]/50">
          {customers.length} firma
        </p>

        <div className="mt-6 mb-6 flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Firma veya temsilci ara..."
            />
          </div>
          <div className="w-[220px]">
            <Select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as CustomerListSortBy)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {canWrite && (
            <Button type="button" onClick={() => setCreateModalOpen(true)}>
              + Müşteri Ekle
            </Button>
          )}
        </div>

        <CustomerCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />

        {customers.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {customers.map((customer) => (
              <CustomerListCard
                key={customer.id}
                customer={customer}
                onClick={() => router.push(`/customers/${customer.id}?from=/customers`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[45vh] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <p className="text-sm text-[#f0ede8]/50">Müşteri bulunamadı.</p>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
}
