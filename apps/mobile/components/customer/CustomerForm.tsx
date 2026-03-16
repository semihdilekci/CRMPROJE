import { View, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface CustomerFormProps {
  visible: boolean;
  fairId: string | null;
  onClose: () => void;
}

/**
 * Yeni müşteri ekleme formu.
 * M13'te tam implementasyon eklenecek (firma, ad, telefon, e-posta, bütçe vb.)
 */
export function CustomerForm({ visible, fairId, onClose }: CustomerFormProps) {
  return (
    <BottomSheet
      isVisible={visible && !!fairId}
      onClose={onClose}
      title="Yeni Müşteri Ekle"
    >
      <View className="gap-4">
        <Text className="text-white/70 text-sm">
          Müşteri formu (firma, ad, iletişim, bütçe, ürünler) M13'te eklenecek.
        </Text>
        <Button onPress={onClose} variant="secondary">
          Kapat
        </Button>
      </View>
    </BottomSheet>
  );
}
