import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView } from 'react-native';
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

function getProductOptionsForRow(
  row: SelectedProductRow,
  allRows: SelectedProductRow[],
  availableProducts: Product[]
): Product[] {
  const otherIds = new Set(
    allRows
      .filter((r) => r.productId && r.productId !== row.productId)
      .map((r) => r.productId)
  );
  return availableProducts.filter(
    (p) => p.id === row.productId || !otherIds.has(p.id)
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
    [selectedProducts, onChange]
  );

  const updateRow = useCallback(
    (rowIndex: number, patch: Partial<SelectedProductRow>) => {
      onChange(
        selectedProducts.map((p, i) =>
          i === rowIndex ? { ...p, ...patch } : p
        )
      );
    },
    [selectedProducts, onChange]
  );

  const addRow = useCallback(() => {
    onChange([
      ...selectedProducts,
      {
        productId: '',
        productName: '',
        quantity: null,
        unit: 'ton',
        note: null,
      },
    ]);
  }, [selectedProducts, onChange]);

  return (
    <View className="gap-2">
      {selectedProducts.length > 0 && (
        <View className="gap-2 rounded-xl border border-white/20 bg-white/5 p-2">
          {selectedProducts.map((row, index) => (
            <ProductRow
              key={row.productId || `row-${index}`}
              row={row}
              index={index}
              options={getProductOptionsForRow(row, selectedProducts, availableProducts)}
              onUpdate={(patch) => updateRow(index, patch)}
              onRemove={() => removeProduct(index)}
            />
          ))}
        </View>
      )}
      <Pressable
        onPress={addRow}
        className="rounded-lg border border-white/20 px-2.5 py-1.5 self-start"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white/60 text-[12px] font-medium">
          Ürün Ekle
        </Text>
      </Pressable>
    </View>
  );
}

interface ProductRowProps {
  row: SelectedProductRow;
  index: number;
  options: Product[];
  onUpdate: (patch: Partial<SelectedProductRow>) => void;
  onRemove: () => void;
}

function ProductRow({ row, options, onUpdate, onRemove }: ProductRowProps) {
  const [showProductModal, setShowProductModal] = useState(false);

  return (
    <>
      <View className="flex-row items-center gap-2 flex-wrap">
        <Pressable
          onPress={() => setShowProductModal(true)}
          className="flex-1 min-w-[100px] rounded-lg border border-white/20 bg-white/5 px-2 py-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text
            className="text-[14px] text-white"
            numberOfLines={1}
          >
            {row.productName || 'Ürün seçin'}
          </Text>
        </Pressable>
        <TextInput
          placeholder="Miktar"
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="numeric"
          value={row.quantity != null ? String(row.quantity) : ''}
          onChangeText={(v) => {
            const num = v === '' ? null : parseFloat(v);
            onUpdate({
              quantity:
                num != null && !isNaN(num) ? num : null,
            });
          }}
          className="w-16 rounded-lg border border-white/20 bg-white/5 px-2 py-2 text-white text-[13px] text-right"
        />
        <View className="flex-row">
          {UNITS.map((u) => (
            <Pressable
              key={u.value}
              onPress={() => onUpdate({ unit: u.value })}
              className={`px-2 py-1.5 rounded ${
                row.unit === u.value ? 'bg-white/20' : 'bg-white/5'
              }`}
            >
              <Text className="text-white text-[12px]">{u.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onRemove} className="p-1">
          <Text className="text-[#F87171] text-lg">×</Text>
        </Pressable>
      </View>

      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowProductModal(false)}
        >
          <Pressable
            className="bg-[#12121A] rounded-t-2xl border-t border-white/10 max-h-[50%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4">
              <Text className="text-white font-semibold mb-3">Ürün Seçin</Text>
              <ScrollView className="max-h-[300px]">
                {options.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      onUpdate({ productId: p.id, productName: p.name });
                      setShowProductModal(false);
                    }}
                    className="py-3 border-b border-white/10"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                    })}
                  >
                    <Text className="text-white text-[14px]">{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
