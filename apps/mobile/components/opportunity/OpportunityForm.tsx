import { View, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface OpportunityFormProps {
  visible: boolean;
  fairId: string | null;
  onClose: () => void;
}

/**
 * Yeni fırsat oluşturma formu.
 * M12'de tam implementasyon eklenecek (müşteri seçimi, bütçe, ürünler vb.)
 */
export function OpportunityForm({ visible, fairId, onClose }: OpportunityFormProps) {
  return (
    <BottomSheet
      isVisible={visible && !!fairId}
      onClose={onClose}
      title="Yeni Fırsat Oluştur"
    >
      <View className="gap-4">
        <Text className="text-white/70 text-sm">
          Fırsat formu (müşteri seçimi, bütçe, ürünler) M12'de eklenecek.
        </Text>
        <Button onPress={onClose} variant="secondary">
          Kapat
        </Button>
      </View>
    </BottomSheet>
  );
}
