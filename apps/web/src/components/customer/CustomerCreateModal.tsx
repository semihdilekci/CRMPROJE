'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createCustomerContactSchema,
  createCustomerSchema,
  type CreateCustomerContactDto,
  type CreateCustomerWithContactDto,
  type Customer,
  type DuplicateContactMeta,
} from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useCreateCustomerWithContact, useCustomers } from '@/hooks/use-customers';
import { useCreateCustomerContact } from '@/hooks/use-customer-contacts';
import { useDebounce } from '@/hooks/use-debounce';

type TabId = 'new' | 'contact';

interface DuplicateWarning {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  matchedBy?: 'email' | 'phone' | 'both';
}

interface CustomerCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const newCustomerFormSchema = createCustomerSchema.extend({
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
});

type NewCustomerFormValues = z.infer<typeof newCustomerFormSchema>;

export function CustomerCreateModal({ open, onClose }: CustomerCreateModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('new');
  const [includeContact, setIncludeContact] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const createWithContact = useCreateCustomerWithContact();

  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);
  const [pendingContactDto, setPendingContactDto] = useState<CreateCustomerContactDto | null>(
    null,
  );

  const debouncedSearch = useDebounce(searchText, 300);
  const { data: searchResults = [] } = useCustomers(
    activeTab === 'contact' ? debouncedSearch || undefined : undefined,
  );
  const createContact = useCreateCustomerContact(selectedCustomer?.id ?? '');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updateDropdownPosition = useCallback(() => {
    const input = searchInputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    formState: { errors: newErrors },
    reset: resetNew,
  } = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      company: '',
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    formState: { errors: contactErrors },
    reset: resetContact,
  } = useForm<CreateCustomerContactDto>({
    resolver: zodResolver(createCustomerContactSchema),
    mode: 'onTouched',
    defaultValues: { name: '', phone: '', email: '', cardImage: null },
  });

  useEffect(() => {
    if (!open) return;
    setActiveTab('new');
    setIncludeContact(false);
    setSubmitError('');
    setSearchText('');
    setShowDropdown(false);
    setSelectedCustomer(null);
    setDuplicate(null);
    setPendingContactDto(null);
    resetNew({
      company: '',
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    });
    resetContact({ name: '', phone: '', email: '', cardImage: null });
  }, [open, resetNew, resetContact]);

  useLayoutEffect(() => {
    if (!showDropdown || searchResults.length === 0) {
      setDropdownStyle(null);
      return;
    }
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showDropdown, searchResults.length, updateDropdownPosition]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchContainerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleClose = () => {
    onClose();
  };

  const buildContactDto = (data: NewCustomerFormValues): CreateCustomerContactDto | undefined => {
    const name = data.contactName?.trim() ?? '';
    if (!includeContact || !name) return undefined;
    const rawEmail = data.contactEmail?.trim() ?? '';
    return {
      name,
      phone: data.contactPhone?.trim() || null,
      email: rawEmail && rawEmail.includes('@') ? rawEmail : null,
      cardImage: null,
    };
  };

  const onSubmitNewCustomer = async (data: NewCustomerFormValues) => {
    setSubmitError('');
    const company = data.company.trim();
    if (!company) {
      setSubmitError('Firma adı zorunludur.');
      return;
    }
    if (includeContact && !data.contactName?.trim()) {
      setSubmitError('Temsilci adı zorunludur.');
      return;
    }

    const addressTrimmed = data.address?.trim() ?? '';
    const dto: CreateCustomerWithContactDto = {
      company,
      address: addressTrimmed ? addressTrimmed : undefined,
      contact: buildContactDto(data),
    };

    try {
      await createWithContact.mutateAsync(dto);
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(message);
    }
  };

  const submitExistingContact = async (dto: CreateCustomerContactDto, force = false) => {
    if (!selectedCustomer) return;
    setSubmitError('');
    try {
      await createContact.mutateAsync({ ...dto, force });
      handleClose();
    } catch (err) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string; details?: unknown } };
      };
      if (axiosErr.response?.status === 409) {
        const details = axiosErr.response.data?.details as DuplicateContactMeta | undefined;
        if (details?.duplicateOf) {
          setDuplicate(details.duplicateOf);
          setPendingContactDto(dto);
          return;
        }
      }
      const message = axiosErr.response?.data?.message ?? 'Kayıt sırasında bir hata oluştu.';
      setSubmitError(message);
    }
  };

  const onSubmitAddContact = async (data: CreateCustomerContactDto) => {
    if (!selectedCustomer) {
      setSubmitError('Lütfen bir firma seçin.');
      return;
    }
    const rawEmail = data.email?.trim() ?? '';
    const dto: CreateCustomerContactDto = {
      ...data,
      phone: data.phone?.trim() || null,
      email: rawEmail && rawEmail.includes('@') ? rawEmail : null,
      cardImage: null,
    };
    await submitExistingContact(dto, false);
  };

  const handleForceCreate = async () => {
    if (!pendingContactDto) return;
    await submitExistingContact(pendingContactDto, true);
  };

  const tabButtonClass = (tab: TabId) =>
    `flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
      activeTab === tab
        ? 'bg-white/10 text-white border border-white/20'
        : 'text-white/50 hover:text-white/80'
    }`;

  return (
    <Modal open={open} onClose={handleClose} title="Müşteri Ekle" strongerBlur>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={tabButtonClass('new')}
          onClick={() => {
            setActiveTab('new');
            setSubmitError('');
            setDuplicate(null);
          }}
        >
          Yeni Müşteri
        </button>
        <button
          type="button"
          className={tabButtonClass('contact')}
          onClick={() => {
            setActiveTab('contact');
            setSubmitError('');
            setDuplicate(null);
          }}
        >
          Temsilci Ekle
        </button>
      </div>

      {submitError && !duplicate && (
        <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {submitError}
        </p>
      )}

      {activeTab === 'new' ? (
        <form onSubmit={handleSubmitNew(onSubmitNewCustomer)} className="flex flex-col gap-4">
          <Input
            label="Firma Adı"
            placeholder="Firma adı"
            {...registerNew('company')}
            error={newErrors.company?.message}
          />
          <Textarea
            label="Adres"
            placeholder="Adres (isteğe bağlı)"
            {...registerNew('address')}
            className="min-h-[72px]"
          />

          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-white/70">
            <input
              type="checkbox"
              checked={includeContact}
              onChange={(e) => setIncludeContact(e.target.checked)}
              className="rounded border-white/30"
            />
            Temsilci bilgisi ekle
          </label>

          {includeContact && (
            <>
              <Input
                label="Ad Soyad"
                placeholder="Ad soyad (zorunlu)"
                {...registerNew('contactName')}
              />
              <Input
                label="Telefon"
                placeholder="+90 5xx xxx xx xx"
                {...registerNew('contactPhone')}
              />
              <Input
                label="E-posta"
                placeholder="ornek@firma.com"
                type="email"
                {...registerNew('contactEmail')}
              />
            </>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={createWithContact.isPending}>
              {createWithContact.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      ) : duplicate ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-[14px] font-medium text-warning">Benzer temsilci mevcut</p>
            <p className="mt-1 text-[13px] text-white/70">
              {duplicate.matchedBy === 'both' &&
                'Aynı e-posta adresi ve telefon numarası sistemde farklı bir temsilcide kayıtlıdır.'}
              {duplicate.matchedBy === 'email' &&
                'Aynı e-posta adresi sistemde farklı bir temsilcide kayıtlıdır.'}
              {duplicate.matchedBy === 'phone' &&
                'Aynı telefon numarası sistemde farklı bir temsilcide kayıtlıdır.'}
              {!duplicate.matchedBy &&
                'Bu firmada benzer bilgilere sahip bir temsilci zaten mevcut.'}
            </p>
            <p className="mt-2 text-[12px] text-white/50">
              Mevcut temsilci:{' '}
              <span className="font-semibold text-white/80">{duplicate.name}</span>
              {duplicate.email && ` · ${duplicate.email}`}
              {duplicate.phone && ` · ${duplicate.phone}`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={createContact.isPending}
              onClick={handleForceCreate}
            >
              {createContact.isPending ? 'Ekleniyor...' : 'Yine de Ekle'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setDuplicate(null);
                setPendingContactDto(null);
              }}
            >
              Geri
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitContact(onSubmitAddContact)} className="flex flex-col gap-4">
          <div ref={searchContainerRef}>
            <Input
              ref={searchInputRef}
              label="Firma Ara"
              placeholder="Firma adı yazın..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowDropdown(true);
                if (!e.target.value.trim()) setSelectedCustomer(null);
              }}
              onFocus={() => setShowDropdown(true)}
            />
          </div>
          {showDropdown &&
            searchResults.length > 0 &&
            dropdownStyle &&
            typeof document !== 'undefined' &&
            createPortal(
              <ul
                ref={dropdownRef}
                role="listbox"
                className="fixed z-[60] max-h-[240px] overflow-auto rounded-lg border border-white/15 bg-[#1a1a2e] py-1 shadow-lg"
                style={{
                  top: dropdownStyle.top,
                  left: dropdownStyle.left,
                  width: dropdownStyle.width,
                }}
              >
                {searchResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      className="w-full px-3 py-2 text-left text-[14px] text-white/90 hover:bg-white/10"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setSearchText(c.company);
                        setShowDropdown(false);
                        setSubmitError('');
                      }}
                    >
                      {c.company}
                    </button>
                  </li>
                ))}
              </ul>,
              document.body,
            )}

          {selectedCustomer && (
            <p className="text-[13px] text-white/50">
              Seçili firma:{' '}
              <span className="font-semibold text-white/80">{selectedCustomer.company}</span>
              <button
                type="button"
                className="ml-2 text-accent hover:text-accent/80"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSearchText('');
                }}
              >
                Değiştir
              </button>
            </p>
          )}

          {selectedCustomer && (
            <>
              <Input
                label="Ad Soyad"
                placeholder="Ad soyad (zorunlu)"
                {...registerContact('name')}
                error={contactErrors.name?.message}
              />
              <Input
                label="Telefon"
                placeholder="+90 5xx xxx xx xx"
                {...registerContact('phone')}
                error={contactErrors.phone?.message}
              />
              <Input
                label="E-posta"
                placeholder="ornek@firma.com"
                type="email"
                {...registerContact('email')}
                error={contactErrors.email?.message}
              />
            </>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
              İptal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedCustomer || createContact.isPending}
            >
              {createContact.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
