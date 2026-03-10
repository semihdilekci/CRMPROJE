'use client';

import { useState, useRef, useEffect } from 'react';
import type { Customer } from '@crm/shared';
import {
  CURRENCIES,
  CONVERSION_RATES,
  CONVERSION_RATE_LABELS,
  CONVERSION_RATE_COLORS,
} from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ToggleChip } from '@/components/ui/ToggleChip';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useDisplayConfig } from '@/hooks/use-display-config';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  fairId: string;
  initial?: Customer | null;
}

export function CustomerFormModal({ open, onClose, fairId, initial }: CustomerFormModalProps) {
  const isEdit = !!initial;
  const createCustomer = useCreateCustomer(fairId);
  const updateCustomer = useUpdateCustomer(fairId);
  const { data: productList = [] } = useProducts();
  const { data: displayConfig } = useDisplayConfig();
  const loading = createCustomer.isPending || updateCustomer.isPending;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCurrency = displayConfig?.defaultCurrency ?? 'TRY';
  const conversionRateLabels = displayConfig?.conversionRateLabels ?? CONVERSION_RATE_LABELS;

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budgetRaw, setBudgetRaw] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState(defaultCurrency);
  const [conversionRate, setConversionRate] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [cardImage, setCardImage] = useState('');

  useEffect(() => {
    if (open && initial) {
      setCompany(initial.company);
      setName(initial.name);
      setPhone(initial.phone ?? '');
      setEmail(initial.email ?? '');
      setBudgetRaw(initial.budgetRaw ?? '');
      setBudgetCurrency(initial.budgetCurrency ?? defaultCurrency);
      setConversionRate(initial.conversionRate ?? '');
      setProducts(initial.products);
      setCardImage(initial.cardImage ?? '');
    } else if (open) {
      resetForm();
    }
  }, [open, initial, defaultCurrency]);

  const resetForm = () => {
    setCompany('');
    setName('');
    setPhone('');
    setEmail('');
    setBudgetRaw('');
    setBudgetCurrency(defaultCurrency);
    setConversionRate('');
    setProducts([]);
    setCardImage('');
  };

  const handleBudgetChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setBudgetRaw(raw);
  };

  const budgetDisplay = budgetRaw ? parseInt(budgetRaw, 10).toLocaleString('tr-TR') : '';

  const toggleProduct = (product: string) => {
    setProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCardImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const dto = {
      company: company.trim(),
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      budgetRaw: budgetRaw || null,
      budgetCurrency: budgetRaw ? (budgetCurrency as any) : null,
      conversionRate: conversionRate || null,
      products,
      cardImage: cardImage || null,
    } as any;

    try {
      setSubmitError('');
      if (isEdit && initial) {
        await updateCustomer.mutateAsync({ id: initial.id, dto });
      } else {
        await createCustomer.mutateAsync(dto);
      }
      onClose();
    } catch {
      setSubmitError('Kaydetme sırasında bir hata oluştu. Lütfen alanları kontrol edin.');
    }
  };

  const [submitError, setSubmitError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    email.trim().length > 0 && !emailRegex.test(email.trim())
      ? 'Geçerli bir e-posta adresi giriniz (örn: ad@email.com)'
      : '';

  const isValid = company.trim().length > 0 && name.trim().length > 0 && !emailError;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Firma Adı"
            placeholder="Firma adı"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Input
            label="Ad Soyad"
            placeholder="Ad soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Telefon"
            type="tel"
            placeholder="+90 555 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="E-posta"
            type="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError || undefined}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
            Tahmini Bütçe
          </label>
          <div className="flex">
            <input
              inputMode="numeric"
              placeholder="0"
              value={budgetDisplay}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="flex-1 rounded-l-[10px] border border-r-0 border-border bg-surface px-3 py-2.5 text-right text-text transition-colors focus:border-accent focus:outline-none"
            />
            <select
              value={budgetCurrency}
              onChange={(e) => setBudgetCurrency(e.target.value)}
              className="rounded-r-[10px] border border-l-0 border-border bg-surface px-3 py-2.5 font-bold text-accent transition-colors focus:border-accent focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
            Satışa Dönüşme Tahmini
          </label>
          <div className="flex flex-wrap gap-2">
            {CONVERSION_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setConversionRate(conversionRate === rate ? '' : rate)}
                className="cursor-pointer rounded-[8px] border px-3 py-1.5 text-[13px] font-medium transition-all duration-150"
                style={
                  conversionRate === rate
                    ? {
                        backgroundColor: `${CONVERSION_RATE_COLORS[rate]}25`,
                        borderColor: `${CONVERSION_RATE_COLORS[rate]}50`,
                        color: CONVERSION_RATE_COLORS[rate],
                      }
                    : {
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-muted)',
                      }
                }
              >
                {conversionRateLabels[rate] ?? CONVERSION_RATE_LABELS[rate]}
                <span className="ml-1 opacity-70">
                  {rate === 'very_high' && '80-100%'}
                  {rate === 'high' && '60-80%'}
                  {rate === 'medium' && '40-60%'}
                  {rate === 'low' && '20-40%'}
                  {rate === 'very_low' && '0-20%'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
            İlgilenilen Ürünler
          </label>
          <div className="flex flex-wrap gap-2">
            {productList.map((product) => (
              <ToggleChip
                key={product.id}
                label={product.name}
                selected={products.includes(product.name)}
                color="#ff6b35"
                onClick={() => toggleProduct(product.name)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
            Kartvizit Fotoğrafı
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {cardImage ? (
            <div className="relative">
              <img
                src={cardImage}
                alt="Kartvizit"
                className="max-h-[160px] rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => setCardImage('')}
                className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[12px] text-white"
                style={{ backgroundColor: '#000000AA' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full cursor-pointer rounded-[10px] border-2 border-dashed border-border px-4 py-6 text-center text-muted transition-colors hover:border-accent hover:text-accent"
            >
              📷 Fotoğraf Yükle
            </button>
          )}
        </div>

        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
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
