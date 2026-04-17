'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  API_ENDPOINTS,
  createCustomerSchema,
  type ApiSuccessResponse,
  type CreateCustomerDto,
} from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useUpdateCustomer } from '@/hooks/use-customers';
import api from '@/lib/api';

export type CustomerEditInitial = {
  id: string;
  company: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  cardImage: string | null;
};

interface CustomerEditModalProps {
  open: boolean;
  onClose: () => void;
  initial: CustomerEditInitial;
}

export function CustomerEditModal({ open, onClose, initial }: CustomerEditModalProps) {
  const updateCustomer = useUpdateCustomer();
  const [submitError, setSubmitError] = useState('');
  const [cardImage, setCardImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerDto>({
    resolver: zodResolver(createCustomerSchema),
    mode: 'onTouched',
    defaultValues: {
      company: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      cardImage: null,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset({
      company: initial.company,
      name: initial.name,
      address: initial.address ?? '',
      phone: initial.phone ?? '',
      email: initial.email ?? '',
      cardImage: initial.cardImage,
    });
    setCardImage(initial.cardImage ?? '');
    setSubmitError('');
  }, [open, initial, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Axios interceptor
    }
    e.target.value = '';
  };

  const onSubmit = async (data: CreateCustomerDto) => {
    setSubmitError('');
    const addressTrimmed = typeof data.address === 'string' ? data.address.trim() : '';
    try {
      await updateCustomer.mutateAsync({
        id: initial.id,
        dto: {
          company: data.company.trim(),
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
          address: addressTrimmed ? addressTrimmed : null,
          cardImage: cardImage || null,
        },
      });
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Müşteriyi Düzenle" strongerBlur>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{submitError}</p>
        )}

        <Input
          label="Firma"
          placeholder="Firma adı"
          {...register('company')}
          error={errors.company?.message}
        />
        <Input
          label="Ad Soyad"
          placeholder="Ad soyad"
          {...register('name')}
          error={errors.name?.message}
        />
        <Textarea
          label="Adres"
          placeholder="Adres (isteğe bağlı)"
          {...register('address')}
          className="min-h-[72px]"
          error={errors.address?.message}
        />
        <Input
          label="Telefon"
          placeholder="Telefon"
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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
            <Button type="button" variant="secondary" className="text-[13px]" onClick={() => fileInputRef.current?.click()}>
              Dosya Seç
            </Button>
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" className="flex-1" disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
