import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import type {
  OpportunityWithDetails,
  Customer,
  Currency,
  ConversionRate,
} from '@crm/shared';
import {
  CURRENCIES,
  CONVERSION_RATES,
  CONVERSION_RATE_LABELS,
  CONVERSION_RATE_COLORS,
} from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerSelectInput } from '@/components/customer/CustomerSelectInput';
import {
  ProductQuantityList,
  type SelectedProductRow,
} from '@/components/opportunity/ProductQuantityList';
import {
  useCreateOpportunity,
  useUpdateOpportunity,
} from '@/hooks/use-opportunities';
import { useUpdateCustomer } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useCustomerFormStore } from '@/stores/customer-form-store';

interface OpportunityFormProps {
  visible: boolean;
  fairId: string | null;
  initial?: OpportunityWithDetails | null;
  onClose: () => void;
}

export function OpportunityForm({
  visible,
  fairId,
  initial,
  onClose,
}: OpportunityFormProps) {
  const isEdit = !!initial;
  const createOpportunity = useCreateOpportunity(fairId ?? '');
  const updateOpportunity = useUpdateOpportunity(fairId ?? '');
  const updateCustomer = useUpdateCustomer();
  const openCustomerForm = useCustomerFormStore((s) => s.open);
  const { data: productList = [] } = useProducts();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [budgetRaw, setBudgetRaw] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<Currency>('TRY');
  const [conversionRate, setConversionRate] = useState<ConversionRate | ''>('');
  const [opportunityProducts, setOpportunityProducts] = useState<
    SelectedProductRow[]
  >([]);
  const [cardImage, setCardImage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible && initial) {
      setSelectedCustomer(initial.customer);
      setBudgetRaw(initial.budgetRaw ?? '');
      setBudgetCurrency((initial.budgetCurrency as Currency) ?? 'TRY');
      setConversionRate((initial.conversionRate as ConversionRate) ?? '');
      setCardImage(initial.customer?.cardImage ?? '');
      setSubmitError('');
      if (
        initial.opportunityProducts &&
        initial.opportunityProducts.length > 0
      ) {
        setOpportunityProducts(
          initial.opportunityProducts.map((op) => ({
            productId: op.productId,
            productName: op.productName ?? op.productId,
            quantity: op.quantity,
            unit: op.unit ?? 'ton',
            note: op.note,
          }))
        );
      } else {
        setOpportunityProducts(
          (initial.products ?? [])
            .map((name) => {
              const product = productList.find((p) => p.name === name);
              return {
                productId: product?.id ?? '',
                productName: name,
                quantity: null,
                unit: 'ton' as const,
                note: null,
              };
            })
            .filter((p) => p.productId)
        );
      }
    } else if (visible) {
      setSelectedCustomer(null);
      setBudgetRaw('');
      setBudgetCurrency('TRY');
      setConversionRate('');
      setOpportunityProducts([]);
      setCardImage('');
      setSubmitError('');
    }
  }, [visible, initial, productList]);

  useEffect(() => {
    if (visible && selectedCustomer) {
      setCardImage(selectedCustomer.cardImage ?? '');
    }
  }, [visible, selectedCustomer?.id, selectedCustomer?.cardImage]);

  const handleBudgetChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setBudgetRaw(raw);
  };

  const budgetDisplay = budgetRaw
    ? parseInt(budgetRaw, 10).toLocaleString('tr-TR')
    : '';

  const handleAddNewCustomer = () => {
    if (fairId) {
      openCustomerForm(fairId, (customer) => setSelectedCustomer(customer));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !fairId) return;

    const opportunityDto = {
      customerId: selectedCustomer.id,
      budgetRaw: budgetRaw || null,
      budgetCurrency: budgetRaw ? budgetCurrency : null,
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
    };

    try {
      setSubmitError('');
      const customerCardImage = selectedCustomer.cardImage ?? '';
      if (cardImage !== customerCardImage) {
        await updateCustomer.mutateAsync({
          id: selectedCustomer.id,
          dto: { cardImage: cardImage || null },
        });
      }
      if (isEdit && initial) {
        await updateOpportunity.mutateAsync({
          id: initial.id,
          dto: opportunityDto,
        });
      } else {
        await createOpportunity.mutateAsync(opportunityDto);
      }
      onClose();
    } catch {
      setSubmitError(
        'Kaydetme sırasında bir hata oluştu. Lütfen alanları kontrol edin.'
      );
    }
  };

  const loading = createOpportunity.isPending || updateOpportunity.isPending;
  const isValid = !!selectedCustomer;

  const conversionRateLabels =
    CONVERSION_RATE_LABELS as Record<string, string>;

  return (
    <BottomSheet
      isVisible={visible && !!fairId}
      onClose={onClose}
      title={isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat Oluştur'}
    >
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 pb-4">
          <CustomerSelectInput
            selectedCustomerId={selectedCustomer?.id ?? null}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            onAddNew={handleAddNewCustomer}
          />

          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              Tahmini Bütçe
            </Text>
            <View className="flex-row rounded-xl border border-white/20 bg-white/5 overflow-hidden">
              <TextInput
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                value={budgetDisplay}
                onChangeText={(v) => handleBudgetChange(v)}
                className="flex-1 px-3 py-2.5 text-white text-[14px] text-right"
              />
              <View className="flex-row border-l border-white/20">
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setBudgetCurrency(c as Currency)}
                    className={`px-3 py-2.5 ${
                      budgetCurrency === c ? 'bg-white/10' : ''
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-bold ${
                        budgetCurrency === c
                          ? 'text-[#8b5cf6]'
                          : 'text-white/70'
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              Satışa Dönüşme Tahmini
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CONVERSION_RATES.map((rate) => (
                <Pressable
                  key={rate}
                  onPress={() =>
                    setConversionRate(conversionRate === rate ? '' : rate)
                  }
                  className="rounded-lg border px-3 py-1.5"
                  style={{
                    borderColor:
                      conversionRate === rate
                        ? `${CONVERSION_RATE_COLORS[rate]}50`
                        : 'rgba(255,255,255,0.2)',
                    backgroundColor:
                      conversionRate === rate
                        ? `${CONVERSION_RATE_COLORS[rate]}25`
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color:
                        conversionRate === rate
                          ? CONVERSION_RATE_COLORS[rate]
                          : 'rgba(255,255,255,0.6)',
                    }}
                    className="text-[13px] font-medium"
                  >
                    {conversionRateLabels[rate] ?? rate}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              İlgilenilen Ürünler
            </Text>
            <ProductQuantityList
              selectedProducts={opportunityProducts}
              availableProducts={productList}
              onChange={setOpportunityProducts}
            />
          </View>

          {submitError ? (
            <View className="rounded-lg bg-[#F87171]/20 px-3 py-2">
              <Text className="text-[#F87171] text-[13px]">{submitError}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3 mt-2">
            <Button
              variant="secondary"
              onPress={onClose}
              disabled={loading}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!isValid || loading}
              className="flex-1"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
