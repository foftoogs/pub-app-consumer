import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextInput as RNTextInput,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string;
  containerStyle?: ViewStyle;
  /** Variant — default `outlined` (bordered), `filled` uses surfaceAlt. */
  variant?: 'outlined' | 'filled';
};

/**
 * Text input primitive with theme-aware colours, optional label,
 * and error state. Consumed by login/verify/create-night/etc.
 */
export const TextField = forwardRef<RNTextInput, TextFieldProps>(function TextField(
  { label, helper, error, containerStyle, variant = 'outlined', style, ...rest },
  ref
) {
  const colors = useThemeColors();

  const inputStyle = {
    backgroundColor: variant === 'filled' ? colors.surfaceAlt : colors.surface,
    borderWidth: 1,
    borderColor: error ? colors.error : colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: colors.text,
    ...Typography.body,
  };

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[inputStyle, style]}
        {...rest}
      />
      {error ? (
        <Text style={[styles.helper, { color: colors.error }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  helper: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
