import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type ScreenProps = ViewProps & {
  /** Apply default horizontal padding. Pass `false` for full-bleed screens. */
  padded?: boolean;
  /** Treat as a safe-area edge-hugging container. Default: top/left/right. */
  edges?: Edges;
  /** Skip SafeAreaView — use for nested screens already inside one. */
  noSafeArea?: boolean;
};

/**
 * Default screen container. Applies background colour, safe-area handling,
 * and optional horizontal padding so feature screens stop re-implementing
 * these basics on their own.
 */
export function Screen({
  style,
  padded = false,
  edges = ['top', 'left', 'right'],
  noSafeArea = false,
  children,
  ...rest
}: ScreenProps) {
  const colors = useThemeColors();
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    ...(padded ? { paddingHorizontal: Spacing.xl } : null),
  };

  if (noSafeArea) {
    return (
      <View style={[containerStyle, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={edges}>
      <View style={[containerStyle, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
