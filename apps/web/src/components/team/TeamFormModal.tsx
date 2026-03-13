'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateTeam, useUpdateTeam } from '@/hooks/use-teams';
import type { TeamWithUserCount } from '@crm/shared';

interface TeamFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: TeamWithUserCount;
}

export function TeamFormModal({ open, onClose, initial }: TeamFormModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const loading = createTeam.isPending || updateTeam.isPending;

  useEffect(() => {
    if (!open) {
      setSubmitError('');
      return;
    }
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setActive(initial?.active ?? true);
  }, [open, initial]);

  const handleSubmit = async () => {
    const nameTrim = name.trim();
    if (!nameTrim) return;
    setSubmitError('');
    try {
      if (isEdit && initial) {
        await updateTeam.mutateAsync({
          id: initial.id,
          dto: { name: nameTrim, description: description.trim() || null, active },
        });
      } else {
        await createTeam.mutateAsync({
          name: nameTrim,
          description: description.trim() || null,
          active,
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

  const isValid = name.trim().length >= 2;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Ekibi Düzenle' : 'Yeni Ekip Oluştur'}>
      <div className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}
        <Input
          label="Ekip adı"
          placeholder="Örn. Satış Ekibi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Açıklama (opsiyonel)"
          placeholder="Kısa açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="team-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          <label htmlFor="team-active" className="text-[14px] text-white">
            Aktif
          </label>
        </div>
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
