import { useRef, useEffect, useCallback } from 'react';
import { View, TextInput, Text } from 'react-native';

const DIGITS = 6;

interface MfaCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onComplete?: (code: string) => void;
}

export function MfaCodeInput({
  value,
  onChange,
  error,
  disabled,
  onComplete,
}: MfaCodeInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = value.padEnd(DIGITS, ' ').split('').slice(0, DIGITS);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    if (value.length === DIGITS && /^\d{6}$/.test(value)) {
      onComplete?.(value);
    }
  }, [value, onComplete]);

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, DIGITS);
      onChange(pasted);
      focusInput(Math.min(pasted.length, DIGITS - 1));
      return;
    }
    if (cleaned && !/^\d*$/.test(cleaned)) return;
    const newDigits = [...digits];
    newDigits[index] = cleaned || ' ';
    const joined = newDigits.join('').replace(/\s/g, '');
    onChange(joined.slice(0, DIGITS));
    if (cleaned && index < DIGITS - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (index: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
      const newDigits = [...digits];
      newDigits[index - 1] = ' ';
      onChange(newDigits.join('').replace(/\s/g, ''));
    }
  };

  return (
    <View className="gap-1.5">
      <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
        Doğrulama Kodu
      </Text>
      <View className="flex-row gap-2 justify-center">
        {Array.from({ length: DIGITS }).map((_, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChangeText={(text) => handleChange(i, text)}
            onKeyPress={(e) => handleKeyPress(i, e)}
            editable={!disabled}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            placeholderTextColor="rgba(255,255,255,0.5)"
            className={`w-11 h-12 rounded-lg border text-center text-lg font-semibold text-white
              border-white/20 bg-white/5
              ${error ? 'border-[#F87171]' : ''}`}
            accessibilityLabel={`Rakam ${i + 1}`}
          />
        ))}
      </View>
      {error ? (
        <Text className="text-[12px] text-[#F87171] text-center">{error}</Text>
      ) : null}
    </View>
  );
}
