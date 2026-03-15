import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.5)"
        className={`rounded-lg border px-3 py-2.5 text-white
          border-white/20 bg-white/5
          ${error ? 'border-[#F87171]' : ''}`}
        {...props}
      />
      {error && <Text className="text-[12px] text-[#F87171]">{error}</Text>}
    </View>
  );
}
