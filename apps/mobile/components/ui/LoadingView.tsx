import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Yükleniyor...' }: LoadingViewProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text className="text-white/60 mt-3 text-[14px]">{message}</Text>
    </View>
  );
}
