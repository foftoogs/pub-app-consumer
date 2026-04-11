import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';

const CARDS: {
  key: string;
  title: string;
  icon: string;
  route: string;
}[] = [
  { key: 'events', title: 'Events', icon: 'calendar', route: '/(app)/nights' },
  { key: 'venues', title: 'Venues', icon: 'location', route: '/(app)/venues' },
  { key: 'profile', title: 'Profile', icon: 'person', route: '/(app)/profile' },
  { key: 'settings', title: 'Settings', icon: 'settings', route: '/(app)/settings' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const consumer = useAuthStore((s) => s.consumer);
  const nights = useNightsStore((s) => s.nights);

  const upcomingCount = nights.filter(
    (n) => new Date(n.date) >= new Date(new Date().toDateString())
  ).length;

  const firstName = consumer?.name?.split(' ')[0] ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      <View style={styles.grid}>
        {CARDS.map((card) => (
          <Pressable
            key={card.key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(card.route as any)}
          >
            <Ionicons name={card.icon as any} size={32} color={colors.primary} />
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.key === 'events' && upcomingCount > 0 && (
              <Text style={styles.cardSubtitle}>
                {upcomingCount} upcoming
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.lg,
    },
    header: {
      marginBottom: Spacing['2xl'],
      paddingHorizontal: Spacing.xs,
    },
    greeting: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    name: {
      ...Typography.displayMedium,
      color: colors.text,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.base,
    },
    card: {
      width: '47%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      ...Elevation.sm,
    },
    cardPressed: {
      backgroundColor: colors.surfacePressed,
      transform: [{ scale: 0.97 }],
    },
    cardTitle: {
      ...Typography.subheading,
      color: colors.text,
      marginTop: Spacing.md,
    },
    cardSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
  });
}
