import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function VenuesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="location-outline" size={48} color={colors.textMuted} />
      <Text style={styles.title}>Venues</Text>
      <Text style={styles.subtitle}>Browse nearby venues — coming soon</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: Spacing.xl,
    },
    title: {
      ...Typography.heading,
      color: colors.text,
      marginTop: Spacing.base,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textMuted,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
  });
}
