import { Colors, type ThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the active palette object. Call this in screens that need
 * multiple colour tokens so styles can be built inside a `useMemo`:
 *
 *   const colors = useThemeColors();
 *   const styles = useMemo(() => createStyles(colors), [colors]);
 */
export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}
