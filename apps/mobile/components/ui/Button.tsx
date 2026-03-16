import { Pressable, Text, type PressableProps } from 'react-native';
import { GradientView } from './GradientView';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  children: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: '', text: 'text-white' },
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

  if (variant === 'primary') {
    return (
      <Pressable
        disabled={disabled}
        className={`overflow-hidden ${disabled ? 'opacity-50' : ''} ${className}`}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        {...props}
      >
        <GradientView
          direction="horizontal"
          style={{
            alignSelf: 'stretch',
            width: '100%',
            minHeight: 44,
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
          }}
        >
          <Text className="text-[14px] font-semibold text-white" style={{ textAlign: 'center' }}>{children}</Text>
        </GradientView>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 ${styles.bg} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{ alignItems: 'center', justifyContent: 'center' }}
      {...props}
    >
      <Text className={`text-[14px] font-semibold ${styles.text}`} style={{ textAlign: 'center' }}>{children}</Text>
    </Pressable>
  );
}
