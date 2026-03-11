'use client';

import { useCallback } from 'react';
import type { Product } from '@crm/shared';
import { ToggleChip } from '@/components/ui/ToggleChip';
import { cn } from '@/lib/utils';

export interface SelectedProductRow {
  productId: string;
  productName: string;
  quantity: number | null;
  unit: string;
  note: string | null;
}

const UNITS = [
  { value: 'ton', label: 'ton' },
  { value: 'kg', label: 'kg' },
  { value: 'adet', label: 'adet' },
] as const;

interface ProductQuantityListProps {
  selectedProducts: SelectedProductRow[];
  availableProducts: Product[];
  onChange: (products: SelectedProductRow[]) => void;
}

function formatTotalSummary(rows: SelectedProductRow[]): string {
  const byUnit: Record<string, number> = {};
  for (const row of rows) {
    if (row.quantity != null && row.quantity > 0) {
      const u = row.unit || 'ton';
      byUnit[u] = (byUnit[u] ?? 0) + row.quantity;
    }
  }
  const parts = Object.entries(byUnit)
    .filter(([, v]) => v > 0)
    .map(([unit, val]) => `${Number(val).toLocaleString('tr-TR')} ${unit}`);
  return parts.length > 0 ? `Toplam: ${parts.join(', ')}` : '';
}

export function ProductQuantityList({
  selectedProducts,
  availableProducts,
  onChange,
}: ProductQuantityListProps) {
  const addProduct = useCallback(
    (product: Product) => {
      if (selectedProducts.some((p) => p.productId === product.id)) return;
      onChange([
        ...selectedProducts,
        {
          productId: product.id,
          productName: product.name,
          quantity: null,
          unit: 'ton',
          note: null,
        },
      ]);
    },
    [selectedProducts, onChange],
  );

  const removeProduct = useCallback(
    (productId: string) => {
      onChange(selectedProducts.filter((p) => p.productId !== productId));
    },
    [selectedProducts, onChange],
  );

  const updateRow = useCallback(
    (productId: string, patch: Partial<SelectedProductRow>) => {
      onChange(
        selectedProducts.map((p) =>
          p.productId === productId ? { ...p, ...patch } : p,
        ),
      );
    },
    [selectedProducts, onChange],
  );

  const summary = formatTotalSummary(selectedProducts);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {availableProducts.map((product) => (
          <ToggleChip
            key={product.id}
            label={product.name}
            selected={selectedProducts.some((p) => p.productId === product.id)}
            color="#ff6b35"
            onClick={() => addProduct(product)}
          />
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            {selectedProducts.map((row) => (
              <div
                key={row.productId}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2',
                  'transition-all duration-150 ease-out',
                )}
              >
                <span className="min-w-0 flex-1 text-[14px] text-muted">
                  {row.productName}
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Miktar"
                  value={row.quantity ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const num = v === '' ? null : Number.parseFloat(v);
                    updateRow(row.productId, {
                      quantity: num != null && !Number.isNaN(num) ? num : null,
                    });
                  }}
                  className="w-20 rounded border border-border bg-card px-2 py-1.5 text-right text-[13px] text-text focus:border-accent focus:outline-none"
                />
                <select
                  value={row.unit}
                  onChange={(e) =>
                    updateRow(row.productId, { unit: e.target.value })
                  }
                  className="w-[70px] rounded border border-border bg-card px-2 py-1.5 text-[13px] text-text focus:border-accent focus:outline-none"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeProduct(row.productId)}
                  className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  aria-label="Kaldır"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {summary && (
            <p className="text-[12px] text-muted">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
