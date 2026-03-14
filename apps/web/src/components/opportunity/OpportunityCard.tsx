'use client';

import { useState } from 'react';
import type { OpportunityWithCustomer } from '@crm/shared';
import {
  formatBudget,
  formatDateTime,
  getConversionRateLabel,
  getConversionRateColor,
  getStageBadgeColor,
  getStageLabel,
  getNextStageInSequence,
  isTerminalStage,
} from '@crm/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteOpportunity } from '@/hooks/use-opportunities';
import { useStageHistory } from '@/hooks/use-opportunity-stages';
import { useDisplayConfig } from '@/hooks/use-display-config';
import { PipelineProgressBar } from '@/components/opportunity/PipelineProgressBar';
import { OfferDownloadButton } from '@/components/opportunity/OfferDownloadButton';
import { StageTransitionModal } from '@/components/opportunity/StageTransitionModal';
import { StageHistory } from '@/components/opportunity/StageHistory';

function formatTonnageShort(quantity: number | null, unit: string): string {
  if (quantity == null || quantity === 0) return '';
  if (unit === 'ton') return `${quantity}t`;
  if (unit === 'kg') return `${quantity} kg`;
  return `${quantity} ${unit}`;
}

function formatTonnageLine(quantity: number | null, unit: string): string {
  if (quantity == null || quantity === 0) return '';
  const u = unit === 'ton' ? 'ton' : unit === 'kg' ? 'kg' : unit;
  return `${Number(quantity).toLocaleString('tr-TR')} ${u}`;
}

interface OpportunityCardProps {
  opportunity: OpportunityWithCustomer;
  fairId: string;
  onEdit: () => void;
}

export function OpportunityCard({
  opportunity,
  fairId,
  onEdit,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [targetStage, setTargetStage] = useState<string>('');
  const deleteOpportunity = useDeleteOpportunity(fairId);
  const { data: stageLogs = [] } = useStageHistory(opportunity.id, {
    enabled: expanded,
  });
  const completedStages = stageLogs.map((l) => l.stage);
  const { data: displayConfig } = useDisplayConfig();

  const rateColor = getConversionRateColor(opportunity.conversionRate);
  const rateLabel =
    opportunity.conversionRate && displayConfig?.conversionRateLabels
      ? displayConfig.conversionRateLabels[opportunity.conversionRate] ??
        getConversionRateLabel(opportunity.conversionRate)
      : getConversionRateLabel(opportunity.conversionRate);

  const handleDelete = async () => {
    await deleteOpportunity.mutateAsync(opportunity.id);
    setShowDelete(false);
  };

  const { customer } = opportunity;
  const hasProducts = (opportunity.opportunityProducts?.length ?? 0) > 0 || (opportunity.products?.length ?? 0) > 0;
  const displayProducts: { productName: string; quantity: number | null; unit: string }[] =
    opportunity.opportunityProducts?.length
      ? opportunity.opportunityProducts.map((op) => ({
          productName: op.productName,
          quantity: op.quantity,
          unit: op.unit ?? 'ton',
        }))
      : (opportunity.products ?? []).map((name) => ({
          productName: name,
          quantity: null as number | null,
          unit: 'ton',
        }));

  const stageColor = getStageBadgeColor(opportunity.currentStage);
  const stageLabel = getStageLabel(opportunity.currentStage);
  const effectiveCurrentStage =
    stageLogs[stageLogs.length - 1]?.stage ?? opportunity.currentStage;
  const currentIsTerminal = isTerminalStage(effectiveCurrentStage);

  const handleStageClick = (stage: string) => {
    if (currentIsTerminal) return;
    if (stage === effectiveCurrentStage) return;

    const nextStage = getNextStageInSequence(effectiveCurrentStage);
    if (!nextStage || stage !== nextStage) return;

    setTargetStage(stage);
    setShowStageModal(true);
  };

  return (
    <>
      <div className="relative min-h-[144px] overflow-hidden rounded-xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 transition-transform duration-300 hover:scale-[1.01]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex h-[144px] w-full cursor-pointer items-stretch justify-between p-4 text-left"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[15px] font-bold text-white">{customer.name}</p>
            <p className="text-[13px] font-semibold text-white/80">
              {customer.company}
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {opportunity.conversionRate && (
                <Badge color={rateColor} className="whitespace-nowrap shrink-0">
                  {rateLabel}
                </Badge>
              )}
              <Badge color={stageColor} className="whitespace-nowrap shrink-0">
                {stageLabel}
              </Badge>
              {displayProducts.slice(0, 2).map((p, i) => (
                <Badge key={`${p.productName}-${i}`} className="whitespace-nowrap shrink-0">
                  {p.quantity != null && p.quantity > 0
                    ? `${p.productName} (${formatTonnageShort(p.quantity, p.unit)})`
                    : p.productName}
                </Badge>
              ))}
              {displayProducts.length > 2 && (
                <Badge className="whitespace-nowrap shrink-0">+{displayProducts.length - 2}</Badge>
              )}
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2 self-center">
            {opportunity.cardImage && (
              <span title="Kartvizit mevcut" className="text-[14px]">
                📇
              </span>
            )}
            <span className="text-white/60 text-[12px]">
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-white/60">
                  Pipeline
                </p>
                <PipelineProgressBar
                  currentStage={
                    stageLogs[stageLogs.length - 1]?.stage ?? opportunity.currentStage
                  }
                  completedStages={completedStages}
                  compact
                  onStageClick={handleStageClick}
                />
              </div>

              {opportunity.budgetRaw && (
                <p>
                  <span className="text-white/60">Tahmini Bütçe: </span>
                  <span className="font-semibold text-white">
                    {formatBudget(opportunity.budgetRaw)}{' '}
                    {opportunity.budgetCurrency ?? ''}
                  </span>
                </p>
              )}

              <p className="text-white/60">
                Kayıt: {formatDateTime(opportunity.createdAt)}
              </p>

              {(customer.phone || customer.email) && (
                <div className="grid grid-cols-2 gap-2">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-white/90 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞 {customer.phone}
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="break-all text-white/90 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✉️ {customer.email}
                    </a>
                  )}
                </div>
              )}

              {hasProducts && (
                <div className="mt-1 rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2">
                  <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-white/60">İlgilenilen Ürünler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {displayProducts.map((p, i) => {
                      const line =
                        p.quantity != null && p.quantity > 0
                          ? `${p.productName} — ${formatTonnageLine(p.quantity, p.unit)}`
                          : p.productName;
                      return (
                        <Badge key={`${p.productName}-${i}`}>
                          {line}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {opportunity.cardImage && (
                <div className="mt-2 rounded-xl border border-white/20 overflow-hidden bg-white/5 p-2">
                  <img
                    src={opportunity.cardImage}
                    alt="Kartvizit"
                    className="max-h-[120px] rounded-lg object-contain"
                  />
                </div>
              )}

              <div className="mt-2 rounded-xl border border-white/20 backdrop-blur-xl bg-white/5 px-3 py-2">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-white/60">
                  Aşama Geçmişi
                </p>
                <StageHistory opportunityId={opportunity.id} compact />
              </div>

              <OfferDownloadButton opportunityId={opportunity.id} />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 text-[13px]"
              >
                ✏️ Düzenle
              </Button>
              <Button
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDelete(true);
                }}
                className="w-[100px] text-[13px]"
              >
                🗑 Sil
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Fırsatı Sil"
        message={`"${customer.name}" (${customer.company}) fırsatını silmek istediğinizden emin misiniz?`}
        loading={deleteOpportunity.isPending}
      />

      <StageTransitionModal
        open={showStageModal}
        onClose={() => setShowStageModal(false)}
        opportunityId={opportunity.id}
        fairId={fairId}
        currentStage={opportunity.currentStage}
        targetStage={targetStage}
        opportunity={opportunity}
      />
    </>
  );
}
