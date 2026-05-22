import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { UpdateCustomerDto } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUpdateCustomer } from '@/hooks/use-customers';

interface CustomerEditSheetProps {
  visible: boolean;
  customerId: string;
  initial: {
    company: string;
    address: string | null;
  };
  onClose: () => void;
}

export function CustomerEditSheet({
  visible,
  customerId,
  initial,
  onClose,
}: CustomerEditSheetProps) {
  const updateCustomer = useUpdateCustomer();
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setCompany(initial.company);
      setAddress(initial.address ?? '');
      setSubmitError('');
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    const dto: UpdateCustomerDto = {
      company: company.trim(),
      address: address.trim() || null,
    };
    if (!dto.company) {
      setSubmitError('Firma adı zorunludur');
      return;
    }
    try {
      setSubmitError('');
      await updateCustomer.mutateAsync({ id: customerId, dto });
      onClose();
    } catch {
      setSubmitError('Güncelleme başarısız. Alanları kontrol edin.');
    }
  };

  const loading = updateCustomer.isPending;

  return (
    <BottomSheet isVisible={visible} onClose={onClose} title="Firmayı Düzenle">
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          <Input label="Firma Adı" value={company} onChangeText={setCompany} maxLength={200} />
          <Input label="Adres (opsiyonel)" value={address} onChangeText={setAddress} maxLength={1000} />
          {submitError ? (
            <View className="rounded-lg bg-[#F87171]/20 px-3 py-2">
              <Text className="text-[#F87171] text-[13px]">{submitError}</Text>
            </View>
          ) : null}
          <View className="flex-row gap-3 mt-2">
            <Button variant="secondary" onPress={onClose} disabled={loading} className="flex-1">
              İptal
            </Button>
            <Button onPress={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
