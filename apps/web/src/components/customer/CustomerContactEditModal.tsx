'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  API_ENDPOINTS,
  createCustomerContactSchema,
  type ApiSuccessResponse,
  type CreateCustomerContactDto,
  type CustomerContact,
  type DuplicateContactMeta,
} from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useCreateCustomerContact,
  useUpdateCustomerContact,
} from '@/hooks/use-customer-contacts';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
import api from '@/lib/api';

interface DuplicateWarning {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  matchedBy?: 'email' | 'phone' | 'both';
}

interface CustomerContactEditModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  companyName?: string;
  initial?: CustomerContact | null;
  onContactSelected?: (contactId: string) => void;
}

export function CustomerContactEditModal({
  open,
  onClose,
  customerId,
  companyName,
  initial,
  onContactSelected,
}: CustomerContactEditModalProps) {
  const isEdit = !!initial;
  const createContact = useCreateCustomerContact(customerId);
  const updateContact = useUpdateCustomerContact(customerId);
  const { scanBusinessCard, isLoading: ocrLoading } = useBusinessCardOcr();

  const [submitError, setSubmitError] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);
  const [pendingDto, setPendingDto] = useState<CreateCustomerContactDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCustomerContactDto>({
    resolver: zodResolver(createCustomerContactSchema),
    mode: 'onTouched',
    defaultValues: { name: '', phone: '', email: '', cardImage: null },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      phone: initial?.phone ?? '',
      email: initial?.email ?? '',
      cardImage: initial?.cardImage ?? null,
    });
    setCardImage(initial?.cardImage ?? '');
    setSubmitError('');
    setDuplicate(null);
    setPendingDto(null);
  }, [open, initial, reset]);

  const handleCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiSuccessResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD.CARD_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (data.success && data.data?.url) setCardImage(data.data.url);
    } catch {
      // Axios interceptor handles error
    }
    e.target.value = '';
  };

  const handleScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await scanBusinessCard(file);
    if (parsed) {
      if (parsed.name) setValue('name', parsed.name, { shouldValidate: true });
      if (parsed.phone) setValue('phone', parsed.phone, { shouldValidate: true });
      if (parsed.email) setValue('email', parsed.email, { shouldValidate: true });
    }
    e.target.value = '';
  };

  const submitContact = async (dto: CreateCustomerContactDto, force = false) => {
    setSubmitError('');
    try {
      if (isEdit && initial) {
        await updateContact.mutateAsync({ id: initial.id, dto });
        onClose();
      } else {
        await createContact.mutateAsync({ ...dto, force });
        onClose();
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; details?: unknown } } };
      if (axiosErr.response?.status === 409) {
        const details = axiosErr.response.data?.details as DuplicateContactMeta | undefined;
        if (details?.duplicateOf) {
          setDuplicate(details.duplicateOf);
          setPendingDto(dto);
          return;
        }
      }
      const message = axiosErr.response?.data?.message ?? 'Kayıt sırasında bir hata oluştu.';
      setSubmitError(message);
    }
  };

  const onSubmit = async (data: CreateCustomerContactDto) => {
    const rawEmail = data.email?.trim() ?? '';
    const dto: CreateCustomerContactDto = {
      ...data,
      phone: data.phone?.trim() || null,
      // OCR bazen eksik TLD ile e-posta çekebilir; @ içermiyorsa null gönder
      email: rawEmail && rawEmail.includes('@') ? rawEmail : null,
      cardImage: cardImage || null,
    };
    await submitContact(dto, false);
  };

  const handleForceCreate = async () => {
    if (!pendingDto) return;
    await submitContact(pendingDto, true);
  };

  const handleSelectExisting = () => {
    if (!duplicate) return;
    onContactSelected?.(duplicate.id);
    onClose();
  };

  const title = isEdit ? 'Temsilciyi Düzenle' : 'Temsilci Ekle';

  return (
    <Modal open={open} onClose={onClose} title={title} strongerBlur>
      {duplicate ? (
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
            {onContactSelected && (
              <Button type="button" className="w-full" onClick={handleSelectExisting}>
                Mevcut Temsilciyi Seç
              </Button>
            )}
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
              onClick={() => { setDuplicate(null); setPendingDto(null); }}
            >
              İptal
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{submitError}</p>
          )}

          {companyName && (
            <p className="text-[13px] text-white/50">
              Firma: <span className="font-semibold text-white/80">{companyName}</span>
            </p>
          )}

          <Input
            label="Ad Soyad"
            placeholder="Ad soyad (zorunlu)"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Telefon"
            placeholder="+90 5xx xxx xx xx"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="E-posta"
            placeholder="ornek@firma.com"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <div>
            <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
              Kartvizit Görseli
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCardImageChange}
            />
            <input
              ref={scanFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScanChange}
            />
            <div className="flex flex-wrap items-center gap-3">
              {cardImage ? (
                <img
                  src={cardImage}
                  alt="Kartvizit"
                  className="h-[72px] max-w-[140px] rounded-lg border border-white/20 object-contain"
                />
              ) : (
                <span className="text-[13px] text-white/45">Yüklenmedi</span>
              )}
              <Button
                type="button"
                variant="secondary"
                className="text-[13px]"
                onClick={() => fileInputRef.current?.click()}
              >
                Dosya Seç
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="text-[13px]"
                disabled={ocrLoading}
                onClick={() => scanFileRef.current?.click()}
              >
                {ocrLoading ? 'Taranıyor...' : 'Kartvizit Tara'}
              </Button>
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createContact.isPending || updateContact.isPending}
            >
              {createContact.isPending || updateContact.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
