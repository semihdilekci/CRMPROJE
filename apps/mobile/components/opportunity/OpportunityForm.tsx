import { View, Text } from 'react-native';
import type { OpportunityWithDetails } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface OpportunityFormProps {
  visible: boolean;
  fairId: string | null;
  initial?: OpportunityWithDetails | null;
  onClose: () => void;
}

/**
 * Yeni fırsat oluşturma / fırsat düzenleme formu.
 * M12'de tam implementasyon eklenecek (müşteri seçimi, bütçe, ürünler vb.)
 */
export function OpportunityForm({
  visible,
  fairId,
  initial,
  onClose,
}: OpportunityFormProps) {
  const isEdit = !!initial;
  return (
    <BottomSheet
      isVisible={visible && !!fairId}
      onClose={onClose}
      title={isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat Oluştur'}
    >
      <View className="gap-4">
        <Text className="text-white/70 text-sm">
          Fırsat formu (müşteri seçimi, bütçe, ürünler) M12'de eklenecek.
          {isEdit && ` Düzenleniyor: ${initial.customer?.name}`}
        </Text>
        <Button onPress={onClose} variant="secondary">
          Kapat
        </Button>
      </View>
    </BottomSheet>
  );
}
