'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import type { Product } from '@crm/shared';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Product;
}

export function ProductFormModal({ open, onClose, initial }: ProductFormModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [submitError, setSubmitError] = useState('');
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const loading = createProduct.isPending || updateProduct.isPending;

  useEffect(() => {
    if (!open) {
      setSubmitError('');
      return;
    }
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
  }, [open, initial]);

  const handleSubmit = async () => {
    const nameTrim = name.trim();
    if (!nameTrim) return;
    setSubmitError('');
    try {
      if (isEdit && initial) {
        await updateProduct.mutateAsync({
          id: initial.id,
          dto: { name: nameTrim, description: description.trim() || null },
        });
      } else {
        await createProduct.mutateAsync({
          name: nameTrim,
          description: description.trim() || null,
        });
      }
      onClose();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(msg);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}>
      <div className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}
        <Input
          label="Ürün adı"
          placeholder="Örn. Endüstriyel Pompalar"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Açıklama (opsiyonel)"
          placeholder="Kısa açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
