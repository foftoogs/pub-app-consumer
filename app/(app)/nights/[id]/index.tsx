import { useMemo, useState } from 'react';
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
  const activateNight = useNightsStore((s) => s.activateNight);
  const consumer = useAuthStore((s) => s.consumer);
  const [activating, setActivating] = useState(false);

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

  const handleActivate = () => {
    Alert.alert(
      'Go Live',
      'This will activate the night and enable encrypted live features for all members. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Live',
          onPress: async () => {
            setActivating(true);
            try {
              await activateNight(night.id);
            } catch (err: any) {
              Alert.alert('Activation Failed', err.message ?? 'Could not activate night.');
            } finally {
              setActivating(false);
            }
          },
        },
      ],
    );
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

      {night.status === 'active' && (
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
          <Text style={[styles.liveText, { color: colors.live }]}>Night is live</Text>
        </View>
      )}

      <View style={styles.actions}>
        {isOrganiser && night.status === 'planning' && (
          <>
            <Button
              label={activating ? 'Activating...' : 'Go Live'}
              variant="secondary"
              onPress={handleActivate}
              loading={activating}
              fullWidth
            />
            <Button label="Delete Night" variant="destructive" onPress={handleDelete} fullWidth />
          </>
        )}
      </View>
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
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.md,
    },
    liveDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    liveText: {
      ...Typography.bodyMedium,
    },
    actions: {
      marginTop: Spacing['3xl'],
      gap: Spacing.md,
    },
  });
}
