import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  children: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: {
    bg: 'bg-[#8b5cf6]',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-white/5 border border-white/10',
    text: 'text-white',
  },
  danger: {
    bg: 'bg-[#F87171]/20 border border-[#F87171]/40',
    text: 'text-[#F87171]',
  },
};

export function Button({
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <Pressable
      disabled={disabled}
      className={`rounded-lg px-4 py-2.5 ${styles.bg} ${disabled ? 'opacity-50' : ''} ${className}`}
      {...props}
    >
      <Text className={`text-[14px] font-semibold ${styles.text}`}>{children}</Text>
    </Pressable>
  );
}
