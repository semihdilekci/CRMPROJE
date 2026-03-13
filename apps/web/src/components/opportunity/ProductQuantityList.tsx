'use client';

import { useCallback } from 'react';
import type { Product } from '@crm/shared';

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

/** Diğer satırlarda seçilmemiş ürünler + bu satırın mevcut ürünü */
function getProductOptionsForRow(
  row: SelectedProductRow,
  allRows: SelectedProductRow[],
  availableProducts: Product[],
): Product[] {
  const otherRowsProductIds = new Set(
    allRows.filter((r) => r.productId && r.productId !== row.productId).map((r) => r.productId),
  );
  return availableProducts.filter(
    (p) => p.id === row.productId || !otherRowsProductIds.has(p.id),
  );
}

export function ProductQuantityList({
  selectedProducts,
  availableProducts,
  onChange,
}: ProductQuantityListProps) {
  const removeProduct = useCallback(
    (rowIndex: number) => {
      onChange(selectedProducts.filter((_, i) => i !== rowIndex));
    },
    [selectedProducts, onChange],
  );

  const updateRow = useCallback(
    (rowIndex: number, patch: Partial<SelectedProductRow>) => {
      onChange(
        selectedProducts.map((p, i) =>
          i === rowIndex ? { ...p, ...patch } : p,
        ),
      );
    },
    [selectedProducts, onChange],
  );

  const summary = formatTotalSummary(selectedProducts);

  return (
    <div className="flex flex-col gap-2">
      {selectedProducts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 rounded-lg border border-white/20 backdrop-blur-xl bg-white/5 p-2">
            {selectedProducts.map((row, index) => {
              const options = getProductOptionsForRow(row, selectedProducts, availableProducts);
              return (
                <div
                  key={row.productId || `row-${index}`}
                  className="flex items-center gap-2 transition-all duration-150 ease-out"
                >
                  <select
                    value={row.productId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const product = availableProducts.find((p) => p.id === id);
                      updateRow(index, {
                        productId: id,
                        productName: product?.name ?? '',
                      });
                    }}
                    className="min-w-0 flex-1 rounded border border-white/20 bg-white/5 px-2 py-1.5 text-[14px] text-white focus:border-violet-400/60 focus:outline-none"
                  >
                    <option value="">Ürün seçin</option>
                    {options.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Miktar"
                  value={row.quantity ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const num = v === '' ? null : Number.parseFloat(v);
                    updateRow(index, {
                      quantity: num != null && !Number.isNaN(num) ? num : null,
                    });
                  }}
                  className="w-20 rounded border border-white/20 bg-white/5 px-2 py-1.5 text-right text-[13px] text-white focus:border-violet-400/60 focus:outline-none"
                />
                <select
                  value={row.unit}
                  onChange={(e) => updateRow(index, { unit: e.target.value })}
                  className="w-[70px] rounded border border-white/20 bg-white/5 px-2 py-1.5 text-[13px] text-white focus:border-violet-400/60 focus:outline-none"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="shrink-0 rounded p-1 text-white/60 transition-colors hover:bg-danger/20 hover:text-danger"
                  aria-label="Kaldır"
                >
                  ×
                </button>
              </div>
            );
            })}
          </div>
          {summary && (
            <p className="text-[12px] text-white/60">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
