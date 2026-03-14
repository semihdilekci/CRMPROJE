'use client';

import { useCallback } from 'react';
import type { Product } from '@crm/shared';
import { CURRENCIES } from '@crm/shared';

export interface OfferProductRow {
  productId: string;
  productName: string;
  price: string;
  currency: string;
}

interface OfferProductPriceListProps {
  rows: OfferProductRow[];
  availableProducts: Product[];
  onChange: (rows: OfferProductRow[]) => void;
}

function getProductOptionsForRow(
  row: OfferProductRow,
  allRows: OfferProductRow[],
  availableProducts: Product[],
): Product[] {
  const otherRowsProductIds = new Set(
    allRows.filter((r) => r.productId && r.productId !== row.productId).map((r) => r.productId),
  );
  return availableProducts.filter(
    (p) => p.id === row.productId || !otherRowsProductIds.has(p.id),
  );
}

export function OfferProductPriceList({
  rows,
  availableProducts,
  onChange,
}: OfferProductPriceListProps) {
  const removeRow = useCallback(
    (rowIndex: number) => {
      onChange(rows.filter((_, i) => i !== rowIndex));
    },
    [rows, onChange],
  );

  const updateRow = useCallback(
    (rowIndex: number, patch: Partial<OfferProductRow>) => {
      onChange(
        rows.map((p, i) => (i === rowIndex ? { ...p, ...patch } : p)),
      );
    },
    [rows, onChange],
  );

  const addRow = useCallback(() => {
    const firstAvailable = availableProducts.find(
      (p) => !rows.some((r) => r.productId === p.id),
    );
    if (firstAvailable) {
      onChange([
        ...rows,
        {
          productId: firstAvailable.id,
          productName: firstAvailable.name,
          price: '',
          currency: 'TRY',
        },
      ]);
    }
  }, [rows, availableProducts, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-lg border border-white/20 backdrop-blur-xl bg-white/5 p-2">
        {rows.map((row, index) => {
          const options = getProductOptionsForRow(row, rows, availableProducts);
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
                type="text"
                placeholder="Fiyat"
                value={row.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                className="w-24 rounded border border-white/20 bg-white/5 px-2 py-1.5 text-right text-[13px] text-white focus:border-violet-400/60 focus:outline-none placeholder:text-white/50"
              />
              <select
                value={row.currency}
                onChange={(e) => updateRow(index, { currency: e.target.value })}
                className="w-[70px] rounded border border-white/20 bg-white/5 px-2 py-1.5 text-[13px] text-white focus:border-violet-400/60 focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded p-1 text-white/60 transition-colors hover:bg-danger/20 hover:text-danger"
                aria-label="Kaldır"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded border border-dashed border-white/30 px-3 py-1.5 text-[13px] text-white/70 transition-colors hover:border-violet-400/60 hover:text-white"
      >
        + Ürün ekle
      </button>
    </div>
  );
}
