import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type {
  OpportunityWithDetails,
  Customer,
  CustomerContact,
  CustomerWithContacts,
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
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { useFairs } from '@/hooks/use-fairs';
import { CustomerSelectInput } from '@/components/customer/CustomerSelectInput';
import {
  ProductQuantityList,
  type SelectedProductRow,
} from '@/components/opportunity/ProductQuantityList';
import {
  useCreateOpportunity,
  useUpdateOpportunity,
} from '@/hooks/use-opportunities';
import { useUpdateCustomerContact } from '@/hooks/use-customer-contacts';
import { useProducts } from '@/hooks/use-products';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
import { useCustomerFormStore } from '@/stores/customer-form-store';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';
import { getAssetBaseUrl } from '@/lib/api';

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
  const [selectedFairId, setSelectedFairId] = useState<string>('');
  const effectiveFairId = fairId ?? (selectedFairId || null);
  const needsFairSelection = !fairId && !isEdit;
  const { data: fairs = [] } = useFairs();
  const fairOptions: DropdownOption<string>[] = fairs.map((f) => ({
    value: f.id,
    label: f.name,
  }));
  const createOpportunity = useCreateOpportunity(effectiveFairId ?? '');
  const updateOpportunity = useUpdateOpportunity(effectiveFairId ?? '');
  const updateContact = useUpdateCustomerContact();
  const { scanBusinessCard, isLoading: ocrLoading } = useBusinessCardOcr();
  const openCustomerForm = useCustomerFormStore((s) => s.open);
  const oppClose = useOpportunityFormStore((s) => s.close);
  const oppOpen = useOpportunityFormStore((s) => s.open);
  const preselectedCustomer = useOpportunityFormStore((s) => s.preselectedCustomer);
  const preselectedContact = useOpportunityFormStore((s) => s.preselectedContact);
  const clearPreselection = useOpportunityFormStore((s) => s.clearPreselection);
  const prevCustomerIdRef = useRef<string | null>(null);
  const { data: productList = [] } = useProducts();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
  const [budgetRaw, setBudgetRaw] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<Currency>('TRY');
  const [conversionRate, setConversionRate] = useState<ConversionRate | ''>('');
  const [opportunityProducts, setOpportunityProducts] = useState<SelectedProductRow[]>([]);
  const [cardImage, setCardImage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedFairId(fairId ?? '');
    }
  }, [visible, fairId]);

  useEffect(() => {
    if (visible && initial) {
      setSelectedCustomer(initial.customer);
      setSelectedContact(initial.contact ?? null);
      setBudgetRaw(initial.budgetRaw ?? '');
      setBudgetCurrency((initial.budgetCurrency as Currency) ?? 'TRY');
      setConversionRate((initial.conversionRate as ConversionRate) ?? '');
      setCardImage(initial.contact?.cardImage ?? '');
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
      clearPreselection();
      prevCustomerIdRef.current = initial.customer.id;
    } else if (visible && preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer as Customer);
      setSelectedContact(preselectedContact);
      setCardImage(preselectedContact?.cardImage ?? '');
      setSubmitError('');
      prevCustomerIdRef.current = preselectedCustomer.id;
      clearPreselection();
    } else if (visible) {
      setSelectedCustomer(null);
      setSelectedContact(null);
      setBudgetRaw('');
      setBudgetCurrency('TRY');
      setConversionRate('');
      setOpportunityProducts([]);
      setCardImage('');
      setSubmitError('');
      prevCustomerIdRef.current = null;
    }
  }, [
    visible,
    initial,
    preselectedCustomer,
    preselectedContact,
    productList,
    clearPreselection,
  ]);

  useEffect(() => {
    if (!visible) {
      prevCustomerIdRef.current = null;
      return;
    }
    if (!selectedCustomer || initial) return;

    const prev = prevCustomerIdRef.current;
    const current = selectedCustomer.id;
    if (prev !== null && prev !== current) {
      setSelectedContact(null);
      setCardImage('');
    }
    prevCustomerIdRef.current = current;
  }, [visible, selectedCustomer?.id, initial]);

  const handleBudgetChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setBudgetRaw(raw);
  };

  const budgetDisplay = budgetRaw
    ? parseInt(budgetRaw, 10).toLocaleString('tr-TR')
    : '';

  const handleAddNewCustomer = () => {
    if (!effectiveFairId) return;
    oppClose();
    const reopenOpp = () => oppOpen(effectiveFairId);
    openCustomerForm(effectiveFairId, (created) => {
      const withContacts = created as CustomerWithContacts;
      const contact = withContacts.contacts?.[0] ?? null;
      oppOpen(
        effectiveFairId,
        undefined,
        {
          id: withContacts.id,
          company: withContacts.company,
          address: withContacts.address,
        },
        contact,
      );
    }, reopenOpp);
  };

  const pickImageAndRunOcr = async (
    launchFn: () => Promise<ImagePicker.ImagePickerResult>,
  ) => {
    const result = await launchFn();
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const rawFilename = uri.split('/').pop() ?? '';
    const hasValidExt = /\.(jpg|jpeg|png|webp|gif)$/i.test(rawFilename);
    const filename = hasValidExt ? rawFilename : 'card-image.jpg';
    const ocrResult = await scanBusinessCard(uri, filename, 'image/jpeg');
    if (ocrResult) {
      setCardImage(ocrResult.url);
      if (selectedContact) {
        try {
          await updateContact.mutateAsync({
            id: selectedContact.id,
            dto: { cardImage: ocrResult.url },
            customerId: selectedCustomer?.id,
          });
        } catch {
          // kartvizit güncelleme hatası sessiz geçer; local state zaten güncellendi
        }
      }
      setSubmitError('');
    } else {
      setSubmitError('Kartvizit okunamadı. Lütfen daha net bir fotoğraf deneyin.');
    }
  };

  const handleAddCard = () => {
    const options: Array<{ text: string; onPress: () => void }> = [];
    if (Platform.OS !== 'web') {
      options.push({
        text: 'Kamera',
        onPress: async () => {
          const { status } =
            await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            setSubmitError('Kamera erişim izni gerekli');
            return;
          }
          await pickImageAndRunOcr(() =>
            ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [3, 4],
              quality: 0.8,
            }),
          );
        },
      });
    }
    options.push({
      text: 'Galeri',
      onPress: async () => {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setSubmitError('Galeri erişim izni gerekli');
          return;
        }
        await pickImageAndRunOcr(() =>
          ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          }),
        );
      },
    });
    if (options.length === 1) {
      options[0].onPress();
    } else {
      Alert.alert(
        'Kartvizit Ekle',
        'Kamera veya galeriden fotoğraf seçin',
        [
          ...options.map((o) => ({ text: o.text, onPress: o.onPress })),
          { text: 'İptal', style: 'cancel' as const },
        ],
      );
    }
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Kartviziti Sil',
      'Kartvizit fotoğrafını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!selectedCustomer) return;
            setCardImage('');
            try {
              if (initial?.contact?.id) {
                await updateContact.mutateAsync({
                  id: initial.contact.id,
                  dto: { cardImage: null },
                  customerId: selectedCustomer.id,
                });
              }
            } catch {
              setSubmitError('Kartvizit silinirken hata oluştu');
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !effectiveFairId) return;

    const opportunityDto = {
      customerId: selectedCustomer.id,
      contactId: selectedContact?.id ?? null,
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
      const contactCardImage = initial?.contact?.cardImage ?? '';
      if (
        cardImage !== contactCardImage &&
        selectedContact?.id &&
        initial?.contact?.id === selectedContact.id
      ) {
        await updateContact.mutateAsync({
          id: selectedContact.id,
          dto: { cardImage: cardImage || null },
          customerId: selectedCustomer.id,
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
        'Kaydetme sırasında bir hata oluştu. Lütfen alanları kontrol edin.',
      );
    }
  };

  const loading = createOpportunity.isPending || updateOpportunity.isPending;
  const isValid =
    !!selectedCustomer && (!needsFairSelection || !!effectiveFairId);

  const conversionRateLabels =
    CONVERSION_RATE_LABELS as Record<string, string>;

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      title={isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat Oluştur'}
    >
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          {needsFairSelection ? (
            <View>
              <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
                Fuar
              </Text>
              <Dropdown
                value={selectedFairId}
                options={fairOptions}
                onSelect={setSelectedFairId}
                placeholder="Fuar seçin"
              />
            </View>
          ) : null}

          <CustomerSelectInput
            selectedCustomerId={selectedCustomer?.id ?? null}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            onAddNew={effectiveFairId ? handleAddNewCustomer : undefined}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
          />

          {selectedCustomer ? (
            <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden">
              <View className="flex-row items-center justify-between px-3 pt-2 pb-1.5">
                <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
                  Kartvizit
                  {selectedContact ? ` — ${selectedContact.name}` : ''}
                </Text>
                {cardImage && selectedContact ? (
                  <Pressable
                    onPress={handleDeleteCard}
                    disabled={updateContact.isPending}
                    className="p-1.5"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-[#F87171] text-[14px]">🗑</Text>
                  </Pressable>
                ) : null}
              </View>
              {!selectedContact ? (
                <View className="px-3 pb-3">
                  <Text className="text-white/40 text-[13px] text-center py-4">
                    Kartvizit eklemek için önce bir temsilci seçin
                  </Text>
                </View>
              ) : cardImage ? (
                <Image
                  source={{
                    uri: cardImage.startsWith('http')
                      ? cardImage
                      : `${getAssetBaseUrl()}${cardImage}`,
                  }}
                  className="h-32 w-full"
                  resizeMode="contain"
                />
              ) : (
                <Pressable
                  onPress={handleAddCard}
                  disabled={ocrLoading}
                  className="rounded-lg border-2 border-dashed border-white/30 py-6 mx-3 mb-3 items-center"
                  style={({ pressed }) => ({
                    opacity: pressed || ocrLoading ? 0.8 : 1,
                  })}
                >
                  <Text className="text-white/60 text-[14px]">
                    {ocrLoading ? '⏳ Tara...' : '📇 Kartvizit Ekle'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}

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
