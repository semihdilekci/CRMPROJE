import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ExpoLogoIconProps {
  size?: number;
  color?: string;
}

/**
 * Web TopBar ile aynı logo ikonu (sparkle/star benzeri)
 */
export function ExpoLogoIcon({ size = 20, color = 'white' }: ExpoLogoIconProps) {
  return <MaterialCommunityIcons name="sparkles" size={size} color={color} />;
}
