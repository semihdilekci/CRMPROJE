import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';

interface CustomersTabIconProps {
  size?: number;
  focused?: boolean;
}

export function CustomersTabIcon({ size = 25, focused }: CustomersTabIconProps) {
  const iconColor = '#ffffff';

  if (focused) {
    return (
      <LinearGradient
        colors={['rgba(139,92,246,0.2)', 'rgba(6,182,212,0.2)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          width: 45,
          height: 45,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            shadowColor: '#8b5cf6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Users size={size} color={iconColor} strokeWidth={2} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Users size={size} color="rgba(255,255,255,0.85)" strokeWidth={2} />
    </View>
  );
}
