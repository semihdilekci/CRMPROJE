'use client';

import { useState, useRef, useEffect } from 'react';
import type { OpportunityWithCustomer, Customer } from '@crm/shared';
import {
  CURRENCIES,
  CONVERSION_RATES,
  CONVERSION_RATE_LABELS,
  CONVERSION_RATE_COLORS,
} from '@crm/shared';
import type { Currency, ConversionRate } from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CustomerSelectInput } from '@/components/opportunity/CustomerSelectInput';
import {
  ProductQuantityList,
  type SelectedProductRow,
} from '@/components/opportunity/ProductQuantityList';
import {
  useCreateOpportunity,
  useUpdateOpportunity,
} from '@/hooks/use-opportunities';
import { useStageHistory } from '@/hooks/use-opportunity-stages';
import { useProducts } from '@/hooks/use-products';
import { StageTransitionModal } from '@/components/opportunity/StageTransitionModal';
import { OfferDownloadButton } from '@/components/opportunity/OfferDownloadButton';
import { getNextStageInSequence, isTerminalStage } from '@crm/shared';

function PipelineAndStageHistoryBlock({
  opportunityId,
  initialCurrentStage,
  fairId,
  opportunity,
}: {
  opportunityId: string;
  initialCurrentStage: string;
  fairId: string;
  opportunity?: OpportunityWithCustomer | null;
}) {
  const [showStageModal, setShowStageModal] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const { data: logs = [] } = useStageHistory(opportunityId);
  const completedStages = logs.map((l) => l.stage);
  const currentStage = logs[logs.length - 1]?.stage ?? initialCurrentStage;
  const currentIsTerminal = isTerminalStage(currentStage);

  const handleStageClick = (stage: string) => {
    if (currentIsTerminal) return;
    if (stage === currentStage) return;
    const nextStage = getNextStageInSequence(currentStage);
    if (!nextStage || stage !== nextStage) return;
    setTargetStage(stage);
    setShowStageModal(true);
  };

  return (
    <>
      <PipelineProgressBar
        currentStage={currentStage}
        completedStages={completedStages}
        onStageClick={handleStageClick}
        compact={false}
        interactive
      />
              <div className="mt-3">
                <StageHistory
                  opportunityId={opportunityId}
                  compact={false}
                  editable
                  allowDeleteLast
                  fairId={fairId}
                />
                <OfferDownloadButton opportunityId={opportunityId} />
              </div>
      <StageTransitionModal
        open={showStageModal}
        onClose={() => setShowStageModal(false)}
        opportunityId={opportunityId}
        fairId={fairId}
        currentStage={currentStage}
        targetStage={targetStage}
        opportunity={opportunity}
      />
    </>
  );
}
import { useDisplayConfig } from '@/hooks/use-display-config';
import { PipelineProgressBar } from '@/components/opportunity/PipelineProgressBar';
import { StageHistory } from '@/components/opportunity/StageHistory';

interface OpportunityFormModalProps {
  open: boolean;
  onClose: () => void;
  fairId: string;
  initial?: OpportunityWithCustomer | null;
}

export function OpportunityFormModal({
  open,
  onClose,
  fairId,
  initial,
}: OpportunityFormModalProps) {
  const isEdit = !!initial;
  const createOpportunity = useCreateOpportunity(fairId);
  const updateOpportunity = useUpdateOpportunity(fairId);
  const { data: productList = [] } = useProducts();
  const { data: displayConfig } = useDisplayConfig();
  const loading = createOpportunity.isPending || updateOpportunity.isPending;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCurrency = displayConfig?.defaultCurrency ?? 'TRY';
  const conversionRateLabels =
    displayConfig?.conversionRateLabels ?? CONVERSION_RATE_LABELS;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [budgetRaw, setBudgetRaw] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState(defaultCurrency);
  const [conversionRate, setConversionRate] = useState('');
  const [opportunityProducts, setOpportunityProducts] = useState<SelectedProductRow[]>([]);
  const [cardImage, setCardImage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open && initial) {
      setSelectedCustomer(initial.customer);
      setBudgetRaw(initial.budgetRaw ?? '');
      setBudgetCurrency(initial.budgetCurrency ?? defaultCurrency);
      setConversionRate(initial.conversionRate ?? '');
      setCardImage(initial.cardImage ?? '');
      setSubmitError('');
      if (initial.opportunityProducts && initial.opportunityProducts.length > 0) {
        setOpportunityProducts(
          initial.opportunityProducts.map((op) => ({
            productId: op.productId,
            productName: op.productName,
            quantity: op.quantity,
            unit: op.unit ?? 'ton',
            note: op.note,
          })),
        );
      } else {
        setOpportunityProducts(
          (initial.products ?? []).map((name) => {
            const product = productList.find((p) => p.name === name);
            return {
              productId: product?.id ?? '',
              productName: name,
              quantity: null,
              unit: 'ton' as const,
              note: null,
            };
          }).filter((p) => p.productId),
        );
      }
    } else if (open) {
      resetForm();
    }
  }, [open, initial, defaultCurrency, productList]);

  const resetForm = () => {
    setSelectedCustomer(null);
    setBudgetRaw('');
    setBudgetCurrency(defaultCurrency);
    setConversionRate('');
    setOpportunityProducts([]);
    setCardImage('');
    setSubmitError('');
  };

  const handleBudgetChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setBudgetRaw(raw);
  };

  const budgetDisplay = budgetRaw
    ? parseInt(budgetRaw, 10).toLocaleString('tr-TR')
    : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCardImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;

    const dto = {
      customerId: selectedCustomer.id,
      budgetRaw: budgetRaw || null,
      budgetCurrency: budgetRaw ? (budgetCurrency as Currency) : null,
      conversionRate: (conversionRate || null) as ConversionRate | null,
      products: [] as string[],
      opportunityProducts: opportunityProducts
        .filter((p) => p.productId)
        .map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unit: p.unit as 'ton' | 'kg' | 'adet',
        note: p.note,
      })),
      cardImage: cardImage || null,
    };

    try {
      setSubmitError('');
      if (isEdit && initial) {
        await updateOpportunity.mutateAsync({ id: initial.id, dto });
      } else {
        await createOpportunity.mutateAsync(dto);
      }
      onClose();
    } catch {
      setSubmitError(
        'Kaydetme sırasında bir hata oluştu. Lütfen alanları kontrol edin.',
      );
    }
  };

  const isValid = !!selectedCustomer;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat Yarat'}
      strongerBlur
    >
      <div className="flex flex-col gap-4">
        <CustomerSelectInput
          selectedCustomerId={selectedCustomer?.id ?? null}
          selectedCustomer={selectedCustomer}
          onSelect={(customer) => setSelectedCustomer(customer)}
        />

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
            Tahmini Bütçe
          </label>
          <div className="flex">
            <input
              inputMode="numeric"
              placeholder="0"
              value={budgetDisplay}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="flex-1 rounded-l-[10px] border border-r-0 border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-right text-white transition-colors focus:border-violet-400/60 focus:outline-none"
            />
            <select
              value={budgetCurrency}
              onChange={(e) => setBudgetCurrency(e.target.value)}
              className="rounded-r-[10px] border border-l-0 border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 font-bold text-violet-400 transition-colors focus:border-violet-400/60 focus:outline-none"
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
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
            Satışa Dönüşme Tahmini
          </label>
          <div className="flex flex-wrap gap-2">
            {CONVERSION_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() =>
                  setConversionRate(conversionRate === rate ? '' : rate)
                }
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
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12px] font-bold uppercase tracking-wider text-white/60">
              İlgilenilen Ürünler
            </label>
            <button
              type="button"
              onClick={() =>
                setOpportunityProducts([
                  ...opportunityProducts,
                  {
                    productId: '',
                    productName: '',
                    quantity: null,
                    unit: 'ton',
                    note: null,
                  },
                ])
              }
              className="cursor-pointer rounded-[8px] border border-white/20 px-2.5 py-1 text-[12px] font-medium text-white/60 transition-colors hover:border-violet-400/60 hover:text-violet-400"
            >
              Ürün Ekle
            </button>
          </div>
          <ProductQuantityList
            selectedProducts={opportunityProducts}
            availableProducts={productList}
            onChange={setOpportunityProducts}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
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
              className="w-full cursor-pointer rounded-[10px] border-2 border-dashed border-white/20 px-4 py-6 text-center text-white/60 transition-colors hover:border-violet-400/60 hover:text-violet-400"
            >
              📷 Fotoğraf Yükle
            </button>
          )}
        </div>

        {isEdit && initial && (
          <div className="mt-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-3">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-white/60">
              Pipeline ve Aşama Geçmişi
            </p>
            <PipelineAndStageHistoryBlock
              opportunityId={initial.id}
              initialCurrentStage={initial.currentStage}
              fairId={fairId}
              opportunity={initial}
            />
          </div>
        )}

        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
