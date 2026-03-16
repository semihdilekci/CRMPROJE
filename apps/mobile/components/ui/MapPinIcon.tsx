import { MapPin } from 'lucide-react-native';

interface MapPinIconProps {
  size?: number;
  color?: string;
}

export function MapPinIcon({ size = 16, color = '#a78bfa' }: MapPinIconProps) {
  return <MapPin size={size} color={color} strokeWidth={2} />;
}
