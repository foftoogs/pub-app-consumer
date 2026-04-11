import { forwardRef, type ReactNode } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type View as RNView,
  type ViewStyle,
} from 'react-native';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Variant = 'filled' | 'outlined' | 'tinted';

type CardProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: Variant;
  elevated?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
};

/**
 * Card primitive consumed by dashboard grid (TOO-39), list items,
 * and night/venue cards. Passes through `Pressable` props so any card
 * can opt into press feedback without re-wrapping.
 */
export const Card = forwardRef<RNView, CardProps>(function Card(
  { variant = 'filled', elevated = false, padded = true, style, children, onPress, ...rest },
  ref
) {
  const colors = useThemeColors();

  const base: ViewStyle = {
    borderRadius: Radius.lg,
    backgroundColor:
      variant === 'tinted'
        ? colors.surfaceAlt
        : variant === 'outlined'
          ? colors.surface
          : colors.surface,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    ...(padded ? { padding: Spacing.base } : null),
    ...(elevated ? Elevation.sm : null),
  };

  if (!onPress) {
    return (
      <View ref={ref} style={[base, style]} {...(rest as object)}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={({ pressed }) => [
        base,
        pressed && { backgroundColor: colors.surfacePressed, transform: [{ scale: 0.99 }] },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
});
