import { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateInput, parseDateInput } from '@crm/shared';

/** value ve onChange dd.mm.yyyy formatında */
interface DateInputProps {
  label?: string;
  value: string;
  onChange: (ddMmYyyy: string) => void;
  error?: string;
  placeholder?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'gg.aa.yyyy',
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const displayValue = value
    ? (value.includes('.') ? value : formatDateInput(value))
    : '';

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    if (cleaned.length <= 10) {
      onChange(cleaned);
    }
  };

  const handlePickerChange = (event: { type: string }, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (date) {
      onChange(formatDateInput(date.toISOString()));
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const pickerDate = (() => {
    const parsed = parseDateInput(displayValue);
    return parsed ? new Date(parsed) : new Date();
  })();

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={{ color: '#ffffff' }}
          className={`flex-1 rounded-lg border px-3 py-2.5
            border-white/20 bg-white/5
            ${error ? 'border-[#F87171]' : ''}`}
          keyboardType="number-pad"
        />
        <Pressable
          onPress={openPicker}
          className="w-10 h-10 rounded-lg border border-white/20 bg-white/5 items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-lg">📅</Text>
        </Pressable>
      </View>
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
          onTouchCancel={() => setShowPicker(false)}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <Pressable
          onPress={() => setShowPicker(false)}
          className="py-2"
        >
          <Text className="text-[#8b5cf6] font-semibold">Tamam</Text>
        </Pressable>
      )}
      {error ? (
        <Text className="text-[12px] text-[#F87171]">{error}</Text>
      ) : null}
    </View>
  );
}
