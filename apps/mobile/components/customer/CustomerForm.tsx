import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CreateCustomerDto } from '@crm/shared';
import { API_ENDPOINTS, type ApiSuccessResponse } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateCustomer } from '@/hooks/use-customers';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
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
  const { scanBusinessCard, isLoading: ocrLoading } = useBusinessCardOcr();
  const { onCreated, markCreatedSuccessfully } = useCustomerFormStore();

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

  const pickImageAndRunOcr = async (
    launchFn: () => Promise<ImagePicker.ImagePickerResult>,
  ) => {
    const result = await launchFn();
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const rawFilename = uri.split('/').pop() ?? '';
    const hasValidExt = /\.(jpg|jpeg|png|webp|gif)$/i.test(rawFilename);
    const filename = hasValidExt ? rawFilename : 'card-image.jpg';
    const type = 'image/jpeg';

    const ocrResult = await scanBusinessCard(uri, filename, type);
    if (ocrResult) {
      setCompany(ocrResult.parsed.company);
      setName(ocrResult.parsed.name);
      setPhone(ocrResult.parsed.phone);
      setEmail(ocrResult.parsed.email);
      setCardImage(ocrResult.url);
      setSubmitError('');
    } else {
      setSubmitError('Kartvizit okunamadı. Lütfen daha net bir fotoğraf deneyin.');
    }
  };

  const handleScanCard = () => {
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          }),
        );
      },
    });

    Alert.alert(
      'Kartvizit Tara',
      'Kamera veya galeriden fotoğraf seçin',
      [
        ...options.map((o) => ({ text: o.text, onPress: o.onPress })),
        { text: 'İptal', style: 'cancel' as const },
      ],
    );
  };

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
        formData
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
      markCreatedSuccessfully();
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
        keyboardDismissMode="on-drag"
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
            maxLength={200}
          />
          <Input
            label="Ad Soyad"
            placeholder="Ad soyad"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setSubmitError('');
            }}
            maxLength={100}
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
            maxLength={30}
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
            maxLength={254}
          />
          <Input
            label="Adres (opsiyonel)"
            placeholder="Adres"
            value={address}
            onChangeText={setAddress}
            maxLength={1000}
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
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleScanCard}
                  disabled={ocrLoading}
                  className="flex-1 rounded-xl border-2 border-dashed border-white/20 p-4 items-center"
                  style={({ pressed }) => ({
                    opacity: pressed || ocrLoading ? 0.8 : 1,
                  })}
                >
                  <Text className="text-white/60 text-[14px]">
                    {ocrLoading ? '⏳ Tara...' : '📇 Kart Vizit Tara'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handlePickImage}
                  className="flex-1 rounded-xl border-2 border-dashed border-white/20 p-4 items-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Text className="text-white/60 text-[14px]">
                    📷 Fotoğraf Yükle
                  </Text>
                </Pressable>
              </View>
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
