import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type SectionItem = { icon: string; label: string; value?: string };

const SECTIONS: { title: string; items: SectionItem[] }[] = [
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications' },
      { icon: 'moon-outline', label: 'Theme', value: 'System' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: 'information-circle-outline', label: 'Version', value: Constants.expoConfig?.version ?? '1.0.0' },
      { icon: 'document-text-outline', label: 'Terms of service' },
      { icon: 'shield-checkmark-outline', label: 'Privacy policy' },
    ],
  },
];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.section}>
            {section.items.map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.row,
                  i === section.items.length - 1 && styles.rowLast,
                ]}
              >
                <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.value ? (
                  <Text style={styles.rowValue}>{item.value}</Text>
                ) : (
                  <Text style={styles.comingSoon}>Coming soon</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.xl,
    },
    sectionWrapper: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.label,
      color: colors.textMuted,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Elevation.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
      marginLeft: Spacing.md,
    },
    rowValue: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    comingSoon: {
      ...Typography.caption,
      color: colors.textMuted,
    },
  });
}
