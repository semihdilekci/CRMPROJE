'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useCreateFair, useUpdateFair } from '@/hooks/use-fairs';
import type { Fair } from '@crm/shared';

interface FairFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Fair;
}

export function FairFormModal({ open, onClose, initial }: FairFormModalProps) {
  const isEdit = !!initial;
  const createFair = useCreateFair();
  const updateFair = useUpdateFair();
  const loading = createFair.isPending || updateFair.isPending;

  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startDate ? initial.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.slice(0, 10) : '');

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    const dto = {
      name: name.trim(),
      address: address.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    if (isEdit && initial) {
      await updateFair.mutateAsync({ id: initial.id, dto });
    } else {
      await createFair.mutateAsync(dto);
    }

    resetAndClose();
  };

  const resetAndClose = () => {
    if (!initial) {
      setName('');
      setAddress('');
      setStartDate('');
      setEndDate('');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={isEdit ? 'Fuarı Düzenle' : 'Yeni Fuar Oluştur'}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Fuar Adı"
          placeholder="Fuar adı giriniz"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Adres / Yer"
          placeholder="Adres bilgisi giriniz"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Başlangıç Tarihi"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Bitiş Tarihi"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="mt-2 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={resetAndClose} disabled={loading}>
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
