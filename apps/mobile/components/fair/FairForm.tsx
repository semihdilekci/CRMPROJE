import { useState, useEffect } from 'react';
import { View } from 'react-native';
import type { Fair } from '@crm/shared';
import { useCreateFair, useUpdateFair } from '@/hooks/use-fairs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FairFormProps {
  visible: boolean;
  onClose: () => void;
  initial?: Fair;
}

export function FairForm({ visible, onClose, initial }: FairFormProps) {
  const isEdit = !!initial;
  const createFair = useCreateFair();
  const updateFair = useUpdateFair();
  const loading = createFair.isPending || updateFair.isPending;

  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startDate ? initial.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ? initial.endDate.slice(0, 10) : ''
  );
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (visible && initial) {
      setName(initial.name);
      setAddress(initial.address);
      setStartDate(initial.startDate ? initial.startDate.slice(0, 10) : '');
      setEndDate(initial.endDate ? initial.endDate.slice(0, 10) : '');
    } else if (visible) {
      setName('');
      setAddress('');
      setStartDate('');
      setEndDate('');
    }
  }, [visible, initial]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setDateError('');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setDateError('Bitiş tarihi başlangıç tarihinden önce olamaz');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const isValid =
    name.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    !dateError;

  const handleSubmit = async () => {
    if (!isValid) return;

    const dto = {
      name: name.trim(),
      address: address.trim(),
      startDate: new Date(startDate + 'T12:00:00.000Z').toISOString(),
      endDate: new Date(endDate + 'T12:00:00.000Z').toISOString(),
    };

    try {
      if (isEdit && initial) {
        await updateFair.mutateAsync({ id: initial.id, dto });
      } else {
        await createFair.mutateAsync(dto);
      }
      onClose();
    } catch {
      // Hata toast/alert M10+ eklenebilir
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={handleClose}
      title={isEdit ? 'Fuarı Düzenle' : 'Yeni Fuar Oluştur'}
    >
      <View className="gap-4">
        <Input
          label="Fuar Adı *"
          placeholder="Fuar adı giriniz"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Adres / Yer"
          placeholder="Adres bilgisi giriniz"
          value={address}
          onChangeText={setAddress}
        />
        <Input
          label="Başlangıç Tarihi *"
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
        />
        <Input
          label="Bitiş Tarihi *"
          placeholder="YYYY-MM-DD"
          value={endDate}
          onChangeText={setEndDate}
          error={dateError || undefined}
        />
        <View className="flex-row gap-3 mt-2">
          <Button
            variant="secondary"
            onPress={handleClose}
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
    </BottomSheet>
  );
}
