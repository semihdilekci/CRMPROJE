'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomerSchema, type UpdateCustomerDto } from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useUpdateCustomer } from '@/hooks/use-customers';

export type CustomerEditInitial = {
  id: string;
  company: string;
  address: string | null;
};

interface CustomerEditModalProps {
  open: boolean;
  onClose: () => void;
  initial: CustomerEditInitial;
}

export function CustomerEditModal({ open, onClose, initial }: CustomerEditModalProps) {
  const updateCustomer = useUpdateCustomer();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateCustomerDto>({
    resolver: zodResolver(createCustomerSchema.partial()),
    mode: 'onTouched',
    defaultValues: {
      company: '',
      address: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      company: initial.company,
      address: initial.address ?? '',
    });
    setSubmitError('');
  }, [open, initial, reset]);

  const onSubmit = async (data: UpdateCustomerDto) => {
    setSubmitError('');
    const addressTrimmed = typeof data.address === 'string' ? data.address.trim() : '';
    try {
      await updateCustomer.mutateAsync({
        id: initial.id,
        dto: {
          company: data.company?.trim(),
          address: addressTrimmed ? addressTrimmed : null,
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
    <Modal open={open} onClose={onClose} title="Firmayı Düzenle" strongerBlur>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{submitError}</p>
        )}

        <Input
          label="Firma Adı"
          placeholder="Firma adı"
          {...register('company')}
          error={errors.company?.message}
        />
        <Textarea
          label="Adres"
          placeholder="Adres (isteğe bağlı)"
          {...register('address')}
          className="min-h-[72px]"
          error={errors.address?.message}
        />

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
