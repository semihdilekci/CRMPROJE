import { View, Text, Pressable } from 'react-native';
import { GradientView } from './GradientView';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

const NETWORK_MESSAGE =
  'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';

export function ErrorState({
  message,
  onRetry,
  isNetworkError = false,
}: ErrorStateProps) {
  const displayMessage = isNetworkError ? NETWORK_MESSAGE : message;

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Text className="text-4xl mb-4">⚠️</Text>
      <Text className="text-white text-center text-[15px] mb-2">
        {displayMessage}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="mt-4 rounded-lg overflow-hidden"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <GradientView
            direction="horizontal"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-white font-semibold text-[14px]">
              Tekrar Dene
            </Text>
          </GradientView>
        </Pressable>
      )}
    </View>
  );
}
