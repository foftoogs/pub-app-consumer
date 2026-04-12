import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';

export default function NightOverviewScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const night = useNightsStore((s) => s.currentNight);
  const deleteNight = useNightsStore((s) => s.deleteNight);
  const consumer = useAuthStore((s) => s.consumer);

  if (!night) return null;

  const isOrganiser = night.organiser.id === consumer?.id;

  const handleDelete = () => {
    Alert.alert('Delete Night', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNight(night.id);
          router.replace('/(app)/nights');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {isOrganiser && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Organiser</Text>
        </View>
      )}

      <View style={styles.details}>
        <DetailRow
          label="Date"
          value={new Date(night.date).toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          styles={styles}
        />
        {night.theme && <DetailRow label="Theme" value={night.theme} styles={styles} />}
        {night.budget != null && (
          <DetailRow label="Budget" value={`$${night.budget} per person`} styles={styles} />
        )}
        <DetailRow label="Members" value={String(night.members_count)} styles={styles} />
        <DetailRow label="Stops" value={String(night.itinerary_count)} styles={styles} />
      </View>

      {isOrganiser && night.status === 'planning' && (
        <View style={styles.actions}>
          <Button label="Delete Night" variant="destructive" onPress={handleDelete} fullWidth />
        </View>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.xl,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      marginBottom: Spacing.xl,
    },
    badgeText: {
      ...Typography.label,
      color: colors.primary,
      letterSpacing: 0.2,
    },
    details: {
      gap: Spacing.base,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rowLabel: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
    },
    rowValue: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    actions: {
      marginTop: Spacing['3xl'],
    },
  });
}
