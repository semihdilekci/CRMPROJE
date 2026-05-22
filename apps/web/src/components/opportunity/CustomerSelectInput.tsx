'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  Customer,
  CustomerContact,
  CreateCustomerContactDto,
  DuplicateContactMeta,
} from '@crm/shared';
import { API_ENDPOINTS, type ApiSuccessResponse } from '@crm/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCustomers, useCreateCustomerWithContact } from '@/hooks/use-customers';
import {
  useCustomerContacts,
  useCreateCustomerContact,
} from '@/hooks/use-customer-contacts';
import { useDebounce } from '@/hooks/use-debounce';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
import api from '@/lib/api';

interface CustomerSelectInputProps {
  selectedCustomer: Customer | null;
  selectedContact: CustomerContact | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onSelectContact: (contact: CustomerContact | null) => void;
}

interface DuplicateWarning {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  matchedBy?: 'email' | 'phone' | 'both';
}

export function CustomerSelectInput({
  selectedCustomer,
  selectedContact,
  onSelectCustomer,
  onSelectContact,
}: CustomerSelectInputProps) {
  // ── Company search state ──────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateFirm, setShowCreateFirm] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [firmError, setFirmError] = useState('');

  // ── Contact creation state ────────────────────────────────────────
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCardImage, setContactCardImage] = useState<string | null>(null);
  const [contactError, setContactError] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);

  const debouncedSearch = useDebounce(searchText, 300);
  const { data: customers = [] } = useCustomers(debouncedSearch || undefined);
  const { data: contacts = [], isLoading: contactsLoading } = useCustomerContacts(
    selectedCustomer?.id ?? null,
  );
  const createWithContact = useCreateCustomerWithContact();
  const createContact = useCreateCustomerContact(selectedCustomer?.id ?? '');
  const { scanBusinessCard, isLoading: ocrLoading } = useBusinessCardOcr();

  const containerRef = useRef<HTMLDivElement>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const resetFirmForm = () => {
    setNewCompany('');
    setNewAddress('');
    setFirmError('');
    setShowCreateFirm(false);
  };

  const resetContactForm = () => {
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactCardImage(null);
    setContactError('');
    setDuplicate(null);
    setShowCreateContact(false);
  };

  const handleSelectCustomer = (c: Customer) => {
    onSelectCustomer(c);
    onSelectContact(null);
    setSearchText('');
    setShowDropdown(false);
    setShowCreateFirm(false);
    resetContactForm();
  };

  const handleClearAll = () => {
    onSelectCustomer(null);
    onSelectContact(null);
    setSearchText('');
    setShowDropdown(false);
    resetFirmForm();
    resetContactForm();
  };

  const handleCreateFirm = async () => {
    if (!newCompany.trim()) {
      setFirmError('Firma adı zorunludur.');
      return;
    }
    try {
      const result = await createWithContact.mutateAsync({
        company: newCompany.trim(),
        address: newAddress.trim() || undefined,
      });
      onSelectCustomer(result);
      onSelectContact(null);
      resetFirmForm();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Firma kaydedilemedi.';
      setFirmError(msg);
    }
  };

  const handleScanForFirm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const parsed = await scanBusinessCard(file);
    if (parsed?.company) {
      setNewCompany(parsed.company);
      // Check if company already exists
      const match = customers.find(
        (c) => c.company.toLowerCase() === parsed.company.toLowerCase(),
      );
      if (match) {
        handleSelectCustomer(match);
        return;
      }
      setShowCreateFirm(true);
    }
  };

  const handleUploadCardImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiSuccessResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD.CARD_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (data.success && data.data?.url) setContactCardImage(data.data.url);
    } catch {
      // Axios interceptor
    }
  };

  const handleScanForContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const parsed = await scanBusinessCard(file);
    if (parsed) {
      if (parsed.name) setContactName(parsed.name);
      if (parsed.phone) setContactPhone(parsed.phone);
      if (parsed.email) setContactEmail(parsed.email);
    }
    // Also upload the image
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiSuccessResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD.CARD_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (data.success && data.data?.url) setContactCardImage(data.data.url);
    } catch {
      // Axios interceptor
    }
  };

  const submitContact = async (force = false) => {
    if (!selectedCustomer) return;
    if (!contactName.trim()) {
      setContactError('Ad soyad zorunludur.');
      return;
    }
    const rawEmail = contactEmail.trim();
    const dto: CreateCustomerContactDto = {
      name: contactName.trim(),
      phone: contactPhone.trim() || null,
      // OCR bazen eksik TLD ile e-posta çekebilir; @ içermiyorsa null gönder
      email: rawEmail && rawEmail.includes('@') ? rawEmail : null,
      cardImage: contactCardImage,
    };
    try {
      const created = await createContact.mutateAsync({ ...dto, force });
      onSelectContact(created);
      resetContactForm();
    } catch (err) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string; details?: unknown } };
      };
      if (axiosErr.response?.status === 409) {
        const details = axiosErr.response.data?.details as DuplicateContactMeta | undefined;
        if (details?.duplicateOf) {
          setDuplicate(details.duplicateOf);
          return;
        }
      }
      const msg = axiosErr.response?.data?.message ?? 'Temsilci kaydedilemedi.';
      setContactError(msg);
    }
  };

  // ── Fully selected state (both firm + contact) ────────────────────
  if (selectedCustomer && selectedContact) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
          Müşteri / Temsilci
        </label>
        <div className="rounded-[10px] border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <p className="text-[14px] font-semibold text-white">{selectedCustomer.company}</p>
          <p className="text-[13px] text-white/70">
            {selectedContact.name}
            {selectedContact.phone && ` · ${selectedContact.phone}`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          className="self-start text-[13px] font-medium text-accent hover:text-accent/80"
        >
          Müşteriyi Değiştir
        </button>
      </div>
    );
  }

  // ── Contact selection mode (firm selected, contact pending) ───────
  if (selectedCustomer) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
          Müşteri / Temsilci
        </label>

        <div className="rounded-[10px] border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <p className="text-[14px] font-semibold text-white">{selectedCustomer.company}</p>
          <button
            type="button"
            onClick={handleClearAll}
            className="mt-0.5 text-[12px] text-accent hover:text-accent/80"
          >
            Değiştir
          </button>
        </div>

        {contactsLoading ? (
          <p className="text-[13px] text-white/50">Temsilciler yükleniyor...</p>
        ) : contacts.length > 0 ? (
          <div className="rounded-[10px] border border-white/20 bg-white/5 backdrop-blur-sm">
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectContact(c)}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-white/10 px-4 py-2.5 text-left last:border-0 hover:bg-white/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white">{c.name}</p>
                  {(c.phone || c.email) && (
                    <p className="text-[12px] text-white/60">
                      {c.phone ?? ''}{c.phone && c.email ? ' · ' : ''}{c.email ?? ''}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSelectContact(null)}
            className="text-[13px] text-white/50 hover:text-white/70"
          >
            Temsilcisiz devam et
          </button>
          <button
            type="button"
            onClick={() => setShowCreateContact(true)}
            className="text-[13px] font-medium text-accent hover:text-accent/80"
          >
            + Yeni Temsilci Ekle
          </button>
        </div>

        {showCreateContact && (
          <div className="rounded-[10px] border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
            {duplicate ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[13px] text-warning">
                    {duplicate.matchedBy === 'both' &&
                      'Aynı e-posta adresi ve telefon numarası sistemde farklı bir temsilcide kayıtlıdır.'}
                    {duplicate.matchedBy === 'email' &&
                      'Aynı e-posta adresi sistemde farklı bir temsilcide kayıtlıdır.'}
                    {duplicate.matchedBy === 'phone' &&
                      'Aynı telefon numarası sistemde farklı bir temsilcide kayıtlıdır.'}
                    {!duplicate.matchedBy &&
                      'Bu firmada benzer bilgilere sahip bir temsilci zaten mevcut.'}
                  </p>
                  <p className="mt-1 text-[12px] text-white/50">
                    Mevcut temsilci:{' '}
                    <span className="font-medium text-white/80">{duplicate.name}</span>
                    {duplicate.email && ` · ${duplicate.email}`}
                    {duplicate.phone && ` · ${duplicate.phone}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="text-[12px]"
                    onClick={() => {
                      const found = contacts.find((c) => c.id === duplicate.id);
                      if (found) onSelectContact(found);
                      resetContactForm();
                    }}
                  >
                    Mevcut Temsilciyi Seç
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-[12px]"
                    disabled={createContact.isPending}
                    onClick={() => submitContact(true)}
                  >
                    Yine de Ekle
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-[12px]"
                    onClick={resetContactForm}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-3 text-[13px] font-semibold text-white">Yeni Temsilci</p>
                <div className="flex flex-col gap-2.5">
                  <Input
                    label="Ad Soyad"
                    placeholder="Ad soyad (zorunlu)"
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); setContactError(''); }}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      label="Telefon"
                      placeholder="+90 5xx ..."
                      value={contactPhone}
                      onChange={(e) => { setContactPhone(e.target.value); setContactError(''); }}
                    />
                    <Input
                      label="E-posta"
                      type="email"
                      placeholder="ornek@firma.com"
                      value={contactEmail}
                      onChange={(e) => { setContactEmail(e.target.value); setContactError(''); }}
                    />
                  </div>
                </div>
                {contactError && (
                  <p className="mt-2 rounded-lg bg-danger/20 px-3 py-1.5 text-[12px] text-danger">
                    {contactError}
                  </p>
                )}
                <input ref={scanFileRef} type="file" accept="image/*" className="hidden" onChange={handleScanForContact} />
                <input ref={cardFileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCardImage} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="text-[12px]"
                    disabled={!contactName.trim() || createContact.isPending}
                    onClick={() => submitContact(false)}
                  >
                    {createContact.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-[12px]"
                    disabled={ocrLoading}
                    onClick={() => scanFileRef.current?.click()}
                  >
                    {ocrLoading ? 'Taranıyor...' : 'Kartvizit Tara'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-[12px]"
                    onClick={resetContactForm}
                  >
                    İptal
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Company search mode (no firm selected yet) ────────────────────
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
        Müşteri / Firma
      </label>

      {!showCreateFirm ? (
        <div ref={containerRef} className="relative">
          <input
            type="text"
            placeholder="Firma adı ara..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="w-full rounded-[10px] border border-white/20 bg-white/5 px-3 py-2.5 text-white backdrop-blur-sm transition-colors placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none"
          />

          {showDropdown && (searchText.length > 0 || customers.length > 0) && (
            <div className="absolute z-20 mt-1 max-h-[200px] w-full overflow-y-auto rounded-[10px] border border-white/20 bg-[rgba(13,13,13,0.9)] shadow-lg backdrop-blur-sm">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="flex w-full cursor-pointer flex-col px-4 py-2.5 text-left hover:bg-white/10"
                  >
                    <span className="text-[13px] font-semibold text-white">{c.company}</span>
                    {c.address && (
                      <span className="text-[12px] text-white/50">{c.address}</span>
                    )}
                  </button>
                ))
              ) : debouncedSearch.length > 0 ? (
                <div className="px-4 py-3 text-[13px] text-white/60">Sonuç bulunamadı</div>
              ) : null}
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => { setShowDropdown(false); setShowCreateFirm(true); }}
              className="text-[13px] font-medium text-accent hover:text-accent/80"
            >
              + Yeni Firma Ekle
            </button>
            <input
              ref={scanFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScanForFirm}
            />
            <button
              type="button"
              disabled={ocrLoading}
              onClick={() => scanFileRef.current?.click()}
              className="text-[13px] text-white/50 hover:text-white/70 disabled:opacity-50"
            >
              {ocrLoading ? 'Taranıyor...' : 'Kartvizit Tara'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
          <p className="mb-3 text-[13px] font-semibold text-white">Yeni Firma</p>
          <div className="flex flex-col gap-2.5">
            <Input
              label="Firma Adı"
              placeholder="Firma adı (zorunlu)"
              value={newCompany}
              onChange={(e) => { setNewCompany(e.target.value); setFirmError(''); }}
            />
            <Input
              label="Adres"
              placeholder="Adres (isteğe bağlı)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
          {firmError && (
            <p className="mt-2 rounded-lg bg-danger/20 px-3 py-1.5 text-[12px] text-danger">
              {firmError}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              className="text-[12px]"
              disabled={!newCompany.trim() || createWithContact.isPending}
              onClick={handleCreateFirm}
            >
              {createWithContact.isPending ? 'Kaydediliyor...' : 'Devam Et'}
            </Button>
            <Button type="button" variant="secondary" className="text-[12px]" onClick={resetFirmForm}>
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
