'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSetSetting } from '@/hooks/use-settings';
import type { SystemSetting } from '@crm/shared';

interface SettingFormModalProps {
  open: boolean;
  onClose: () => void;
  setting: SystemSetting | null;
}

export function SettingFormModal({ open, onClose, setting }: SettingFormModalProps) {
  const [value, setValue] = useState(setting?.value ?? '');
  const [description, setDescription] = useState(setting?.description ?? '');
  const [submitError, setSubmitError] = useState('');
  const setSetting = useSetSetting();
  const loading = setSetting.isPending;

  useEffect(() => {
    if (!open) {
      setSubmitError('');
      return;
    }
    setValue(setting?.value ?? '');
    setDescription(setting?.description ?? '');
  }, [open, setting]);

  const handleSubmit = async () => {
    if (!setting) return;
    setSubmitError('');
    try {
      await setSetting.mutateAsync({
        key: setting.key,
        value,
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(msg);
    }
  };

  if (!setting) return null;

  return (
    <Modal open={open} onClose={onClose} title="Ayarı Düzenle">
      <div className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}
        <Input label="Anahtar" value={setting.key} readOnly disabled className="bg-white/5 opacity-70" />
        <Input
          label="Değer"
          placeholder="Değer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
