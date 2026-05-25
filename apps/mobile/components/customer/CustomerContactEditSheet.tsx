import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CustomerContact } from '@crm/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useCreateCustomerContact,
  useUpdateCustomerContact,
} from '@/hooks/use-customer-contacts';
import { useBusinessCardOcr } from '@/hooks/use-business-card-ocr';
import { getAssetBaseUrl } from '@/lib/api';

interface CustomerContactEditSheetProps {
  visible: boolean;
  customerId: string;
  customerCompany?: string;
  initial?: CustomerContact | null;
  onClose: () => void;
  onContactSelected?: (contact: CustomerContact) => void;
}

export function CustomerContactEditSheet({
  visible,
  customerId,
  customerCompany,
  initial,
  onClose,
  onContactSelected,
}: CustomerContactEditSheetProps) {
  const isEdit = !!initial;
  const createContact = useCreateCustomerContact(customerId);
  const updateContact = useUpdateCustomerContact();
  const { scanBusinessCard, isLoading: ocrLoading } = useBusinessCardOcr();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setPhone(initial?.phone ?? '');
      setEmail(initial?.email ?? '');
      setCardImage(initial?.cardImage ?? null);
      setSubmitError('');
    }
  }, [visible, initial]);

  const cardImageUri = cardImage
    ? cardImage.startsWith('http')
      ? cardImage
      : `${getAssetBaseUrl()}${cardImage}`
    : null;

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
      if (!name.trim()) setName(ocrResult.parsed.name);
      if (!phone.trim()) setPhone(ocrResult.parsed.phone);
      if (!email.trim()) setEmail(ocrResult.parsed.email);

      if (
        customerCompany &&
        ocrResult.parsed.company &&
        ocrResult.parsed.company.toLowerCase().trim() !==
          customerCompany.toLowerCase().trim()
      ) {
        Alert.alert(
          'Farklı Firma',
          `Kartvizitteki firma: "${ocrResult.parsed.company}". Bu temsilci "${customerCompany}" firmasına eklenecek.`,
          [{ text: 'Tamam' }],
        );
      }
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
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  const handleSubmit = async () => {
    const nameTrimmed = name.trim();
    if (!nameTrimmed) {
      setSubmitError('Ad soyad zorunludur');
      return;
    }

    const dto = {
      name: nameTrimmed,
      phone: phone.trim() || null,
      email: email.trim() || null,
      cardImage: cardImage ?? null,
    };

    try {
      setSubmitError('');

      if (isEdit && initial) {
        await updateContact.mutateAsync({ id: initial.id, dto, customerId });
        onClose();
      } else {
        try {
          const newContact = await createContact.mutateAsync(dto);
          onContactSelected?.(newContact);
          onClose();
        } catch (err: unknown) {
          const axiosErr = err as {
            response?: { status?: number; data?: { details?: { duplicateOf?: CustomerContact } } };
          };
          if (axiosErr?.response?.status === 409) {
            const duplicateOf = axiosErr.response?.data?.details?.duplicateOf;
            Alert.alert(
              'Temsilci Zaten Kayıtlı',
              `"${duplicateOf?.name ?? nameTrimmed}" isimli temsilci bu müşteride zaten mevcut.`,
              [
                { text: 'İptal', style: 'cancel' },
                ...(duplicateOf && onContactSelected
                  ? [
                      {
                        text: 'Mevcut Temsilciyi Seç',
                        onPress: () => {
                          onContactSelected(duplicateOf);
                          onClose();
                        },
                      },
                    ]
                  : []),
                {
                  text: 'Yine de Ekle',
                  onPress: async () => {
                    try {
                      const forced = await createContact.mutateAsync({
                        ...dto,
                        force: true,
                      } as typeof dto & { force: boolean });
                      onContactSelected?.(forced);
                      onClose();
                    } catch {
                      setSubmitError('Temsilci eklenemedi. Lütfen tekrar deneyin.');
                    }
                  },
                },
              ],
            );
          } else {
            setSubmitError('Temsilci kaydedilemedi. Lütfen alanları kontrol edin.');
          }
        }
      }
    } catch {
      setSubmitError('İşlem sırasında bir hata oluştu.');
    }
  };

  const loading = createContact.isPending || updateContact.isPending;

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      title={isEdit ? 'Temsilciyi Düzenle' : 'Yeni Temsilci Ekle'}
    >
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-4 pb-4">
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
            label="Telefon (opsiyonel)"
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
            label="E-posta (opsiyonel)"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSubmitError('');
            }}
            keyboardType="email-address"
            maxLength={254}
          />

          <View>
            <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
              Kartvizit Fotoğrafı (opsiyonel)
            </Text>
            {cardImageUri ? (
              <View className="relative">
                <Image
                  source={{ uri: cardImageUri }}
                  className="h-40 w-full rounded-lg"
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
                onPress={handleScanCard}
                disabled={ocrLoading}
                className="rounded-xl border-2 border-dashed border-white/20 p-4 items-center"
                style={({ pressed }) => ({ opacity: pressed || ocrLoading ? 0.8 : 1 })}
              >
                {ocrLoading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#8b5cf6" />
                    <Text className="text-white/60 text-[14px]">Taranıyor...</Text>
                  </View>
                ) : (
                  <Text className="text-white/60 text-[14px]">Kartvizit Tara / Fotoğraf Ekle</Text>
                )}
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
              disabled={!name.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
