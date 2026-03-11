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
              {displayProducts.slice(0, 2).map((p, i) => (
                <Badge key={`${p.productName}-${i}`}>
                  {p.quantity != null && p.quantity > 0
                    ? `${p.productName} (${formatTonnageShort(p.quantity, p.unit)})`
                    : p.productName}
                </Badge>
              ))}
              {displayProducts.length > 2 && (
                <Badge>+{displayProducts.length - 2}</Badge>
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

              {hasProducts && (
                <div className="mt-1">
                  <p className="mb-1.5 text-muted">İlgilenilen Ürünler:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {displayProducts.map((p, i) => {
                      const line =
                        p.quantity != null && p.quantity > 0
                          ? `${p.productName} — ${formatTonnageLine(p.quantity, p.unit)}`
                          : p.productName;
                      return (
                        <Badge key={`${p.productName}-${i}`} color="#ff6b35">
                          {line}
                        </Badge>
                      );
                    })}
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
