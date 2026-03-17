import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  useWindowDimensions,
  LayoutAnimation,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { Product } from '@crm/shared';
import { CURRENCIES, OFFER_UNITS, type OfferUnit } from '@crm/shared';
import { Dropdown } from '@/components/ui/Dropdown';

/** Girilen fiyatı Türkçe formata çevirir: 5000000 -> 5.000.000 */
function formatPriceInput(value: string): string {
  const digitsOnly = value.replace(/[^\d,]/g, '');
  if (digitsOnly === '') return '';
  const normalized = digitsOnly.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return '';
  return num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export interface OfferProductRow {
  productId: string;
  productName: string;
  qty: number;
  unit: OfferUnit;
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
  availableProducts: Product[]
): Product[] {
  const otherRowsProductIds = new Set(
    allRows
      .filter((r) => r.productId && r.productId !== row.productId)
      .map((r) => r.productId)
  );
  return availableProducts.filter(
    (p) => p.id === row.productId || !otherRowsProductIds.has(p.id)
  );
}

const UNIT_OPTIONS = OFFER_UNITS.map((u) => ({
  value: u,
  label: u === 'ton' ? 'Ton' : u === 'kg' ? 'kg' : 'Adet',
}));

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }));

interface ProductCardProps {
  row: OfferProductRow;
  index: number;
  rows: OfferProductRow[];
  availableProducts: Product[];
  updateRow: (index: number, patch: Partial<OfferProductRow>) => void;
  removeRow: (index: number) => void;
}

function ProductCard({
  row,
  index,
  rows,
  availableProducts,
  updateRow,
  removeRow,
}: ProductCardProps) {
  const productOptions = getProductOptionsForRow(row, rows, availableProducts);
  let productDropdownOptions = productOptions.map((p) => ({
    value: p.id,
    label: p.name,
  }));
  if (
    row.productId &&
    row.productName &&
    !productOptions.some((p) => p.id === row.productId)
  ) {
    productDropdownOptions = [
      { value: row.productId, label: row.productName },
      ...productDropdownOptions,
    ];
  }

  return (
    <View className="gap-3">
      <View className="flex-row justify-end -mt-1">
        <Pressable
          onPress={() => removeRow(index)}
          className="p-2 rounded-lg"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Trash2 size={20} color="#F87171" />
        </Pressable>
      </View>

      <View className="gap-2">
        <View>
          <Text className="text-white/60 text-[11px] mb-1">Ürün</Text>
          <Dropdown
            value={row.productId}
            options={productDropdownOptions}
            onSelect={(id) => {
              const p = availableProducts.find((x) => x.id === id);
              updateRow(index, {
                productId: id,
                productName: p?.name ?? '',
              });
            }}
            placeholder="Ürün seçin"
          />
        </View>

        <View>
          <Text className="text-white/60 text-[11px] mb-1">Miktar</Text>
          <TextInput
            value={row.qty ? String(row.qty) : ''}
            onChangeText={(v) => {
              const n = parseFloat(v);
              updateRow(index, {
                qty: isNaN(n) ? 1 : Math.max(0.01, n),
              });
            }}
            placeholder="Örn: 10"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="decimal-pad"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-white text-[14px]"
          />
        </View>

        <View>
          <Text className="text-white/60 text-[11px] mb-1">Birim</Text>
          <Dropdown
            value={row.unit}
            options={UNIT_OPTIONS}
            onSelect={(u) => updateRow(index, { unit: u as OfferUnit })}
          />
        </View>

        <View>
          <Text className="text-white/60 text-[11px] mb-1">Toplam Fiyat</Text>
          <TextInput
            value={row.price}
            onChangeText={(v) =>
              updateRow(index, { price: formatPriceInput(v) })
            }
            placeholder="Örn: 1.000.000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-white text-[14px]"
          />
        </View>

        <View>
          <Text className="text-white/60 text-[11px] mb-1">Para Birimi</Text>
          <Dropdown
            value={row.currency}
            options={CURRENCY_OPTIONS}
            onSelect={(c) => updateRow(index, { currency: c })}
          />
        </View>
      </View>
    </View>
  );
}

const CARD_GAP = 12;

export function OfferProductPriceList({
  rows,
  availableProducts,
  onChange,
}: OfferProductPriceListProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 24;
  const snapInterval = cardWidth + CARD_GAP;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const removeRow = useCallback(
    (rowIndex: number) => {
      onChange(rows.filter((_, i) => i !== rowIndex));
      if (currentIndex >= rowIndex && currentIndex > 0) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    },
    [rows, onChange, currentIndex]
  );

  const updateRow = useCallback(
    (rowIndex: number, patch: Partial<OfferProductRow>) => {
      onChange(
        rows.map((p, i) => (i === rowIndex ? { ...p, ...patch } : p))
      );
    },
    [rows, onChange]
  );

  const addRow = useCallback(() => {
    const firstAvailable = availableProducts.find(
      (p) => !rows.some((r) => r.productId === p.id)
    );
    if (firstAvailable) {
      onChange([
        ...rows,
        {
          productId: firstAvailable.id,
          productName: firstAvailable.name,
          qty: 1,
          unit: 'ton' as OfferUnit,
          price: '',
          currency: 'TRY',
        },
      ]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setCurrentIndex(rows.length);
      }, 100);
    }
  }, [rows, availableProducts, onChange]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / snapInterval);
      if (index >= 0 && index < rows.length) {
        setCurrentIndex((prev) => {
          if (prev !== index) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            return index;
          }
          return prev;
        });
      }
    },
    [snapInterval, rows.length]
  );

  if (rows.length === 0) {
    return (
      <View className="gap-2">
        <Pressable
          onPress={addRow}
          className="rounded-xl border-2 border-dashed border-white/30 py-8 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-white/70 text-[15px]">+ Ürün ekle</Text>
          <Text className="text-white/50 text-[13px] mt-1">
            İlk ürünü ekleyerek başlayın
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <FlatList
        ref={flatListRef}
        data={rows}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingVertical: 12,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => `card-${i}`}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: cardWidth,
              marginRight: index < rows.length - 1 ? CARD_GAP : 0,
            }}
          >
            <View className="rounded-xl border border-white/20 bg-white/5 p-4">
              <ProductCard
                row={item}
                index={index}
                rows={rows}
                availableProducts={availableProducts}
                updateRow={updateRow}
                removeRow={removeRow}
              />
            </View>
          </View>
        )}
      />

      <View className="flex-row justify-center items-center py-2" style={{ gap: 8 }}>
          {rows.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? '#8b5cf6' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </View>

      <Pressable
        onPress={addRow}
        className="self-start rounded-lg border border-dashed border-white/30 px-4 py-2.5"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white/70 text-[14px]">+ Ürün ekle</Text>
      </Pressable>
    </View>
  );
}
