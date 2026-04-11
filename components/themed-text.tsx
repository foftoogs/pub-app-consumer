import { Text, type TextProps, type TextStyle } from 'react-native';

import { Typography, type TypographyVariant } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  /**
   * Typography variant from `constants/typography`. Preferred for new code.
   * Legacy values (`default`, `title`, ...) are still accepted for
   * backwards compatibility with the original Expo template.
   */
  type?:
    | TypographyVariant
    | 'default'
    | 'defaultSemiBold'
    | 'title'
    | 'subtitle'
    | 'link';
};

const LEGACY_VARIANTS: Record<string, TypographyVariant> = {
  default: 'body',
  defaultSemiBold: 'bodySemibold',
  title: 'displayMedium',
  subtitle: 'subheading',
  link: 'bodyMedium',
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({}, 'primary');

  const variant: TypographyVariant =
    type in LEGACY_VARIANTS ? LEGACY_VARIANTS[type] : (type as TypographyVariant);
  const variantStyle: TextStyle = Typography[variant];

  return (
    <Text
      style={[
        { color: type === 'link' ? linkColor : textColor },
        variantStyle,
        style,
      ]}
      {...rest}
    />
  );
}
