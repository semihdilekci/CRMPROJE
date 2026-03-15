'use client';

import { useState, useRef } from 'react';
import type { Customer, CreateCustomerDto } from '@crm/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCustomers, useCreateCustomer } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
import { API_ENDPOINTS, type ApiSuccessResponse } from '@crm/shared';
import api from '@/lib/api';

interface CustomerSelectInputProps {
  selectedCustomerId: string | null;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
}

export function CustomerSelectInput({
  selectedCustomerId,
  selectedCustomer,
  onSelect,
}: CustomerSelectInputProps) {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);
  const { data: customers = [] } = useCustomers(debouncedSearch || undefined);
  const createCustomer = useCreateCustomer();

  const [newCompany, setNewCompany] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scanBusinessCard, isLoading: isOcrLoading } = useBusinessCardOcr();

  const resetCreateForm = () => {
    setNewCompany('');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setCardImageUrl(null);
    setShowCreateForm(false);
  };

  const handleCreateCustomer = async () => {
    const dto: CreateCustomerDto = {
      company: newCompany.trim(),
      name: newName.trim(),
      phone: newPhone.trim() || null,
      email: newEmail.trim() || null,
      cardImage: cardImageUrl || undefined,
    };
    try {
      const created = await createCustomer.mutateAsync(dto);
      onSelect(created);
      resetCreateForm();
      setSearchText('');
      setShowDropdown(false);
    } catch {
      // mutation error handled by react-query
    }
  };

  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const parsed = await scanBusinessCard(file);
    if (parsed) {
      setNewCompany(parsed.company);
      setNewName(parsed.name);
      setNewPhone(parsed.phone);
      setNewEmail(parsed.email);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiSuccessResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD.CARD_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (data.success && data.data?.url) setCardImageUrl(data.data.url);
    } catch {
      // Error handled by api interceptor
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setSearchText('');
    setShowDropdown(false);
    setShowCreateForm(false);
  };

  const handleClearSelection = () => {
    onSelect(null as unknown as Customer);
    setSearchText('');
    setShowDropdown(false);
  };

  if (selectedCustomerId && selectedCustomer) {
    return (
      <div>
        <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
          Müşteri
        </label>
        <div className="flex items-center justify-between rounded-[10px] border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white">
              {selectedCustomer.company}
            </p>
            <p className="text-[13px] text-white/60">
              {selectedCustomer.name}
              {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
              {selectedCustomer.email && ` · ${selectedCustomer.email}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="ml-3 shrink-0 cursor-pointer text-[13px] font-medium text-accent transition-colors hover:text-accent/80"
          >
            Değiştir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
        Müşteri
      </label>

      {!showCreateForm ? (
        <div className="relative">
          <input
            type="text"
            placeholder="Müşteri adı veya firma ara..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full rounded-[10px] border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white transition-colors placeholder:text-white/60/70 focus:border-violet-400/60 focus:outline-none"
          />

          {showDropdown && (searchText.length > 0 || customers.length > 0) && (
            <div className="absolute z-20 mt-1 max-h-[200px] w-full overflow-y-auto rounded-[10px] border border-white/20 bg-[rgba(13,13,13,0.9)] backdrop-blur-sm shadow-lg">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="flex w-full cursor-pointer flex-col px-4 py-2.5 text-left transition-colors hover:bg-white/10"
                  >
                    <span className="text-[13px] font-semibold text-white">
                      {c.company}
                    </span>
                    <span className="text-[12px] text-white/60">
                      {c.name}
                      {c.phone && ` · ${c.phone}`}
                    </span>
                  </button>
                ))
              ) : debouncedSearch.length > 0 ? (
                <div className="px-4 py-3 text-[13px] text-white/60">
                  Sonuç bulunamadı
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setShowCreateForm(true);
              }}
              className="cursor-pointer text-[13px] font-medium text-accent transition-colors hover:text-accent/80"
            >
              + Yeni Müşteri Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-white/20 backdrop-blur-xl bg-white/10 p-4">
          <p className="mb-3 text-[13px] font-semibold text-white">Yeni Müşteri</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Firma Adı"
              placeholder="Firma adı"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
            <Input
              label="Ad Soyad"
              placeholder="Ad soyad"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              label="Telefon"
              type="tel"
              placeholder="+90 555 000 00 00"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="text-[13px]"
                onClick={resetCreateForm}
              >
                İptal
              </Button>
              <Button
                className="text-[13px]"
                onClick={handleCreateCustomer}
                disabled={
                  !newCompany.trim() ||
                  !newName.trim() ||
                  createCustomer.isPending ||
                  isOcrLoading
                }
              >
                {createCustomer.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScanCard}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                className="text-[13px]"
                onClick={() => fileInputRef.current?.click()}
                disabled={isOcrLoading}
              >
                {isOcrLoading ? 'Okunuyor...' : 'Kart Vizit Tara'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
