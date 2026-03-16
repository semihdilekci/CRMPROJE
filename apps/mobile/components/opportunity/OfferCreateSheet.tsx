import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { OpportunityWithDetails } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  useCreateOffer,
  useHasOfferDocument,
  useDownloadOfferDocument,
} from '@/hooks/use-offer';
import { useProducts } from '@/hooks/use-products';

interface OfferCreateSheetProps {
  visible: boolean;
  opportunity: OpportunityWithDetails | null;
  fairId: string | null;
  onClose: () => void;
}

export function OfferCreateSheet({
  visible,
  opportunity,
  fairId,
  onClose,
}: OfferCreateSheetProps) {
  const opportunityId = opportunity?.id ?? '';
  const createOffer = useCreateOffer(opportunityId, fairId ?? undefined);
  const downloadOffer = useDownloadOfferDocument(opportunityId);
  const { data: hasOffer = false } = useHasOfferDocument(opportunityId);
  const { data: productList = [] } = useProducts();

  const [format, setFormat] = useState<'docx' | 'pdf'>('docx');
  const [submitError, setSubmitError] = useState('');

  const oppProducts = opportunity?.opportunityProducts ?? [];
  const products = opportunity?.products ?? [];

  const productItems = useMemo(() => {
    if (oppProducts.length > 0) {
      return oppProducts.map((op) => ({
        productId: op.productId,
        productName: op.productName ?? op.productId,
        qty: op.quantity ?? 1,
        unit: (op.unit ?? 'ton') as 'ton' | 'kg' | 'adet',
        price: '0',
        currency: 'TRY' as const,
      }));
    }
    return products
      .map((name) => {
        const p = productList.find((pr) => pr.name === name);
        return {
          productId: p?.id ?? '',
          productName: name,
          qty: 1,
          unit: 'ton' as const,
          price: '0',
          currency: 'TRY' as const,
        };
      })
      .filter((item) => item.productId);
  }, [oppProducts, products, productList]);

  const canSubmit = productItems.length > 0 && !createOffer.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitError('');
      await createOffer.mutateAsync({
        outputFormat: format,
        productItems: productItems.map((p) => ({
          ...p,
          qty: p.qty > 0 ? p.qty : 1,
          price: p.price || '0',
        })),
      });
      onClose();
    } catch {
      setSubmitError('Teklif oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleDownload = async () => {
    try {
      setSubmitError('');
      await downloadOffer.mutateAsync();
      onClose();
    } catch {
      setSubmitError('Teklif indirilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (!opportunity) return null;

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      title={hasOffer ? 'Teklif İndir' : 'Teklif Oluştur'}
    >
      <ScrollView
        className="max-h-[60vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 pb-4">
          {hasOffer ? (
            <>
              <Text className="text-white/70 text-[14px]">
                Bu fırsat için oluşturulmuş teklif mevcut. İndirip paylaşabilirsiniz.
              </Text>
              {submitError ? (
                <View className="rounded-lg bg-[#F87171]/20 px-3 py-2">
                  <Text className="text-[#F87171] text-[13px]">{submitError}</Text>
                </View>
              ) : null}
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  onPress={onClose}
                  disabled={downloadOffer.isPending}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onPress={handleDownload}
                  disabled={downloadOffer.isPending}
                  className="flex-1"
                >
                  {downloadOffer.isPending ? 'İndiriliyor...' : 'İndir ve Paylaş'}
                </Button>
              </View>
            </>
          ) : (
            <>
          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              Çıktı Formatı
            </Text>
            <View className="flex-row gap-2">
              {(['docx', 'pdf'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFormat(f)}
                  className={`flex-1 rounded-xl border px-4 py-3 ${
                    format === f
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/20'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <Text className="text-white text-center font-medium">
                    {f === 'docx' ? 'Word (.docx)' : 'PDF'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
            <Text className="text-white/60 text-[12px] mb-2">
              Ürünler (fiyatlar 0 olarak eklenecek)
            </Text>
            {productItems.map((p, i) => (
              <Text key={i} className="text-white text-[13px] py-1">
                • {p.productName} — {p.qty} {p.unit}
              </Text>
            ))}
          </View>

          {productItems.length === 0 && (
            <Text className="text-white/60 text-[13px]">
              Bu fırsatta ürün bulunmuyor. Önce fırsatı düzenleyip ürün ekleyin.
            </Text>
          )}

          {submitError ? (
            <View className="rounded-lg bg-[#F87171]/20 px-3 py-2">
              <Text className="text-[#F87171] text-[13px]">{submitError}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3 mt-2">
            <Button
              variant="secondary"
              onPress={onClose}
              disabled={createOffer.isPending}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!canSubmit}
              className="flex-1"
            >
              {createOffer.isPending ? 'Oluşturuluyor...' : 'Oluştur ve Paylaş'}
            </Button>
          </View>
            </>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
