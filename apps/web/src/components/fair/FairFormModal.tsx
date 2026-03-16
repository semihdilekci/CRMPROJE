'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { formatDateInput, parseDateInput } from '@crm/shared';
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
    initial?.startDate ? formatDateInput(initial.startDate) : ''
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ? formatDateInput(initial.endDate) : ''
  );
  const [targetLeadCount, setTargetLeadCount] = useState(
    initial?.targetLeadCount != null ? String(initial.targetLeadCount) : ''
  );
  const [targetTonnage, setTargetTonnage] = useState(
    initial?.targetTonnage != null ? String(initial.targetTonnage) : ''
  );
  const [targetBudgetRaw, setTargetBudgetRaw] = useState(initial?.targetBudget ?? '');

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setAddress(initial.address);
      setStartDate(initial.startDate ? formatDateInput(initial.startDate) : '');
      setEndDate(initial.endDate ? formatDateInput(initial.endDate) : '');
      setTargetLeadCount(
        initial.targetLeadCount != null ? String(initial.targetLeadCount) : ''
      );
      setTargetTonnage(
        initial.targetTonnage != null ? String(initial.targetTonnage) : ''
      );
      setTargetBudgetRaw(initial.targetBudget ?? '');
    } else if (open) {
      setTargetLeadCount('');
      setTargetTonnage('');
      setTargetBudgetRaw('');
    }
  }, [open, initial]);

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return '';
    const startIso = parseDateInput(startDate);
    const endIso = parseDateInput(endDate);
    if (!startIso || !endIso) return '';
    if (new Date(endIso) < new Date(startIso)) {
      return 'Bitiş tarihi başlangıç tarihinden önce olamaz';
    }
    return '';
  }, [startDate, endDate]);

  const isValid =
    name.trim().length > 0 && startDate.length > 0 && endDate.length > 0 && !dateError;

  const handleSubmit = async () => {
    if (!isValid) return;

    const startIso = parseDateInput(startDate);
    const endIso = parseDateInput(endDate);
    if (!startIso || !endIso) return;

    const dto = {
      name: name.trim(),
      address: address.trim(),
      startDate: startIso,
      endDate: endIso,
      targetLeadCount: targetLeadCount.trim()
        ? parseInt(targetLeadCount, 10)
        : null,
      targetTonnage: targetTonnage.trim()
        ? parseFloat(targetTonnage.replace(',', '.'))
        : null,
      targetBudget: targetBudgetRaw.trim() || null,
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
      setTargetLeadCount('');
      setTargetTonnage('');
      setTargetBudgetRaw('');
    }
    onClose();
  };

  const handleTargetBudgetChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setTargetBudgetRaw(raw);
  };

  const targetBudgetDisplay = targetBudgetRaw
    ? parseInt(targetBudgetRaw, 10).toLocaleString('tr-TR')
    : '';

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
          error={name.length === 0 ? undefined : undefined}
        />
        <Textarea
          label="Adres / Yer"
          placeholder="Adres bilgisi giriniz"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <DateInput
            label="Başlangıç Tarihi *"
            placeholder="gg.aa.yyyy"
            value={startDate}
            onChange={setStartDate}
          />
          <DateInput
            label="Bitiş Tarihi *"
            placeholder="gg.aa.yyyy"
            value={endDate}
            onChange={setEndDate}
            error={dateError || undefined}
          />
        </div>
        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-white/60">
            KPI Hedefleri (Opsiyonel)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Fırsat Hedefi"
              type="number"
              min={0}
              placeholder="Örn: 50"
              value={targetLeadCount}
              onChange={(e) => setTargetLeadCount(e.target.value.replace(/[^0-9]/g, ''))}
            />
            <Input
              label="Tonaj Hedefi (ton)"
              type="text"
              inputMode="decimal"
              placeholder="Örn: 1000"
              value={targetTonnage}
              onChange={(e) =>
                setTargetTonnage(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))
              }
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
                Bütçe Hedefi
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Örn: 1.000.000"
                value={targetBudgetDisplay}
                onChange={(e) => handleTargetBudgetChange(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white placeholder:text-white/50 transition-colors duration-200 focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30"
              />
            </div>
          </div>
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
