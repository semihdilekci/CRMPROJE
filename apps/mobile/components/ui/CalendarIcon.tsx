import { Calendar } from 'lucide-react-native';

interface CalendarIconProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 16, color = '#22d3ee' }: CalendarIconProps) {
  return <Calendar size={size} color={color} strokeWidth={2} />;
}
