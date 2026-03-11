'use client';

import { useState } from 'react';
import type { OpportunityWithCustomer } from '@crm/shared';
import {
  formatBudget,
  formatDateTime,
  getConversionRateLabel,
  getConversionRateColor,
} from '@crm/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteOpportunity } from '@/hooks/use-opportunities';
import { useDisplayConfig } from '@/hooks/use-display-config';

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
  const deleteOpportunity = useDeleteOpportunity(fairId);
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

  return (
    <>
      <div className="rounded-xl border border-border bg-card transition-colors hover:border-border-hover">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full cursor-pointer items-start justify-between p-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-text">{customer.name}</p>
            <p className="text-[13px] font-semibold text-accent">
              {customer.company}
            </p>
            <div className="mt-2 flex gap-1.5 overflow-hidden">
              {opportunity.conversionRate && (
                <Badge color={rateColor}>{rateLabel}</Badge>
              )}
              {opportunity.products.slice(0, 1).map((p) => (
                <Badge key={p}>{p}</Badge>
              ))}
              {opportunity.products.length > 1 && (
                <Badge>+{opportunity.products.length - 1}</Badge>
              )}
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            {opportunity.cardImage && (
              <span title="Kartvizit mevcut" className="text-[14px]">
                📇
              </span>
            )}
            <span className="text-muted text-[12px]">
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="flex flex-col gap-2 text-[13px]">
              {opportunity.budgetRaw && (
                <p>
                  <span className="text-muted">Tahmini Bütçe: </span>
                  <span className="font-semibold text-gold">
                    {formatBudget(opportunity.budgetRaw)}{' '}
                    {opportunity.budgetCurrency ?? ''}
                  </span>
                </p>
              )}

              <p className="text-muted">
                Kayıt: {formatDateTime(opportunity.createdAt)}
              </p>

              {(customer.phone || customer.email) && (
                <div className="grid grid-cols-2 gap-2">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-text hover:text-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞 {customer.phone}
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="break-all text-text hover:text-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✉️ {customer.email}
                    </a>
                  )}
                </div>
              )}

              {opportunity.products.length > 0 && (
                <div className="mt-1">
                  <p className="mb-1.5 text-muted">İlgilenilen Ürünler:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.products.map((p) => (
                      <Badge key={p} color="#ff6b35">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {opportunity.cardImage && (
                <div className="mt-2">
                  <img
                    src={opportunity.cardImage}
                    alt="Kartvizit"
                    className="max-h-[120px] rounded-lg object-contain"
                  />
                </div>
              )}
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
    </>
  );
}
