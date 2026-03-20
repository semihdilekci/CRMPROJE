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
    name: string;
    phone: string;
    email: string;
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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setCompany(initial.company);
      setName(initial.name);
      setPhone(initial.phone ?? '');
      setEmail(initial.email ?? '');
      setAddress(initial.address ?? '');
      setSubmitError('');
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    const dto: UpdateCustomerDto = {
      company: company.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || null,
    };
    if (!dto.company || !dto.name || !dto.phone || !dto.email) {
      setSubmitError('Firma, ad, telefon ve e-posta zorunludur');
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
    <BottomSheet isVisible={visible} onClose={onClose} title="Müşteriyi Düzenle">
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
          <Input label="Firma Adı" value={company} onChangeText={setCompany} maxLength={200} />
          <Input label="Ad Soyad" value={name} onChangeText={setName} maxLength={100} />
          <Input
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={30}
          />
          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            maxLength={254}
          />
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
