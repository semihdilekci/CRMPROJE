import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';

interface GradientViewProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  direction?: GradientDirection;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const directionMap: Record<GradientDirection, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};

export function GradientView({
  children,
  style,
  direction = 'horizontal',
  colors = theme.gradients.primary as [string, string],
  start,
  end,
}: GradientViewProps) {
  const { start: startDefault, end: endDefault } = directionMap[direction];
  return (
    <LinearGradient
      colors={colors}
      start={start ?? startDefault}
      end={end ?? endDefault}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
