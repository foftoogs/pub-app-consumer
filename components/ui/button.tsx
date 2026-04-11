import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

/**
 * Button primitive. Variants cover the common CTA styles used across
 * auth, night create, member/invite flows, and the dashboard.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useThemeColors();

  const sizeStyle: ViewStyle = {
    sm: { height: 36, paddingHorizontal: Spacing.base },
    md: { height: 48, paddingHorizontal: Spacing.lg },
    lg: { height: 56, paddingHorizontal: Spacing.xl },
  }[size];

  const labelSize: TextStyle =
    size === 'sm' ? Typography.buttonSmall : Typography.button;

  const variantStyle: { container: ViewStyle; label: TextStyle } = {
    primary: {
      container: { backgroundColor: colors.primary },
      label: { color: colors.textOnPrimary },
    },
    secondary: {
      container: { backgroundColor: colors.secondary },
      label: { color: colors.textOnSecondary },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
      label: { color: colors.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      label: { color: colors.primary },
    },
    destructive: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.error,
      },
      label: { color: colors.error },
    },
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.label.color as string} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text style={[labelSize, variantStyle.label]}>{label}</Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
