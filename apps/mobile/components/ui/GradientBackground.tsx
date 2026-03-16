import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackgroundOrbs } from './AnimatedBackgroundOrbs';

// Design system: mor glow (sol üst) + turkuaz glow (sağ alt) + koyu taban
const GRADIENT_COLORS = [
  '#312e81',  // indigo-900 — mor glow sol üst
  '#0f0a1a', // mor tonlu koyu
  '#030712',  // gray-950 — koyu taban
  '#0f172a',  // slate-900
  '#164e63',  // cyan-800 — turkuaz glow sağ alt
] as const;

const GRADIENT_LOCATIONS = [0, 0.25, 0.5, 0.75, 1] as const;

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <View style={[{ flex: 1 }, style]}>
      <LinearGradient
        colors={[...GRADIENT_COLORS]}
        locations={[...GRADIENT_LOCATIONS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <AnimatedBackgroundOrbs />
      {children}
    </View>
  );
}
