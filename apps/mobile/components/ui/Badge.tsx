import { View, Text } from 'react-native';

interface BadgeProps {
  children: string;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  return (
    <View
      className={`rounded-full px-2.5 py-0.5 bg-white/10 border border-white/20 ${className}`}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              borderColor: `${color}40`,
            }
          : undefined
      }
    >
      <Text
        className="text-[12px] font-medium text-white/90"
        style={color ? { color } : undefined}
      >
        {children}
      </Text>
    </View>
  );
}
