import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CreateCustomerDto } from '@crm/shared';
import { API_ENDPOINTS, type ApiSuccessResponse } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateCustomer } from '@/hooks/use-customers';
import { useCustomerFormStore } from '@/stores/customer-form-store';
import api, { getAssetBaseUrl } from '@/lib/api';

interface CustomerFormProps {
  visible: boolean;
  fairId: string | null;
  onClose: () => void;
}

export function CustomerForm({
  visible,
  fairId,
  onClose,
}: CustomerFormProps) {
  const createCustomer = useCreateCustomer();
  const { onCreated } = useCustomerFormStore();

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setCompany('');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCardImage(null);
      setSubmitError('');
    }
  }, [visible]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSubmitError('Galeri erişim izni gerekli');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match
      ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`
      : 'image/jpeg';

    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as unknown as Blob);

      const { data } = await api.post<ApiSuccessResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD.CARD_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (data.success && data.data?.url) {
        setCardImage(data.data.url);
      }
    } catch {
      setSubmitError('Kartvizit yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async () => {
    const dto: CreateCustomerDto = {
      company: company.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || undefined,
      cardImage: cardImage ?? undefined,
    };

    if (!dto.company || !dto.name || !dto.phone || !dto.email) {
      setSubmitError('Firma, ad, telefon ve e-posta zorunludur');
      return;
    }

    try {
      setSubmitError('');
      const customer = await createCustomer.mutateAsync(dto);
      onCreated?.(customer);
      onClose();
    } catch {
      setSubmitError(
        'Müşteri kaydedilemedi. Lütfen alanları kontrol edin.'
      );
    }
  };

  const loading = createCustomer.isPending;
  const isValid =
    company.trim().length > 0 &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0;

  const cardImageUrl = cardImage
    ? cardImage.startsWith('http')
      ? cardImage
      : `${getAssetBaseUrl()}${cardImage}`
    : null;

  return (
    <BottomSheet
      isVisible={visible && !!fairId}
      onClose={onClose}
      title="Yeni Müşteri Ekle"
    >
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 pb-4">
          <Input
            label="Firma Adı"
            placeholder="Firma adı"
            value={company}
            onChangeText={(t) => {
              setCompany(t);
              setSubmitError('');
            }}
          />
          <Input
            label="Ad Soyad"
            placeholder="Ad soyad"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setSubmitError('');
            }}
          />
          <Input
            label="Telefon"
            placeholder="+90 555 000 00 00"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setSubmitError('');
            }}
            keyboardType="phone-pad"
          />
          <Input
            label="E-posta"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSubmitError('');
            }}
            keyboardType="email-address"
          />
          <Input
            label="Adres (opsiyonel)"
            placeholder="Adres"
            value={address}
            onChangeText={setAddress}
          />

          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              Kartvizit Fotoğrafı (opsiyonel)
            </Text>
            {cardImageUrl ? (
              <View className="relative">
                <Image
                  source={{ uri: cardImageUrl }}
                  className="h-40 rounded-lg"
                  resizeMode="contain"
                />
                <Pressable
                  onPress={() => setCardImage(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
                >
                  <Text className="text-white text-xs">✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickImage}
                className="rounded-xl border-2 border-dashed border-white/20 p-6 items-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Text className="text-white/60 text-[14px]">
                  📷 Fotoğraf Yükle
                </Text>
              </Pressable>
            )}
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
