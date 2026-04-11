import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PLACEHOLDER_ROWS: { icon: string; label: string }[] = [
  { icon: 'create-outline', label: 'Edit name' },
  { icon: 'image-outline', label: 'Change avatar' },
  { icon: 'notifications-outline', label: 'Notification preferences' },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const consumer = useAuthStore((s) => s.consumer);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {consumer?.name ? getInitials(consumer.name) : '?'}
          </Text>
        </View>
        <Text style={styles.name}>{consumer?.name ?? 'Unknown'}</Text>
        <Text style={styles.email}>{consumer?.email ?? ''}</Text>
      </View>

      {/* Placeholder sections */}
      <View style={styles.section}>
        {PLACEHOLDER_ROWS.map((row) => (
          <View key={row.label} style={styles.row}>
            <Ionicons name={row.icon as any} size={22} color={colors.textSecondary} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </View>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
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
    avatarSection: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    initials: {
      ...Typography.heading,
      color: colors.textOnPrimary,
    },
    name: {
      ...Typography.subheading,
      color: colors.text,
    },
    email: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Elevation.sm,
      marginBottom: Spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
      marginLeft: Spacing.md,
    },
    comingSoon: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.base,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.error,
    },
    logoutPressed: {
      opacity: 0.7,
    },
    logoutText: {
      ...Typography.button,
      color: colors.error,
    },
  });
}
