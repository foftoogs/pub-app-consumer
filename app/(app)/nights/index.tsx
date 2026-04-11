import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/stores/nights';
import { Night } from '@/types/night';

function isUpcoming(night: Night) {
  return new Date(night.date) >= new Date(new Date().toDateString());
}

function statusColor(colors: ThemeColors, status: Night['status']) {
  switch (status) {
    case 'planning':
      return colors.info;
    case 'active':
      return colors.success;
    case 'closed':
      return colors.textMuted;
    case 'cancelled':
      return colors.error;
  }
}

export default function NightListScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { nights, loading, error, fetchNights } = useNightsStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchNights();
  }, []);

  const filtered = nights.filter((n) =>
    tab === 'upcoming' ? isUpcoming(n) : !isUpcoming(n)
  );

  const renderNight = useCallback(
    ({ item }: { item: Night }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/(app)/nights/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[styles.statusChip, { backgroundColor: statusColor(colors, item.status) }]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.date).toLocaleDateString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.cardMeta}>
          {item.members_count} {item.members_count === 1 ? 'member' : 'members'}
        </Text>
      </Pressable>
    ),
    [colors, styles]
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNight}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNights}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? 'No upcoming nights' : 'No past nights'}
            </Text>
            {tab === 'upcoming' && (
              <Text style={styles.emptySubtext}>Create one to get started!</Text>
            )}
          </View>
        }
      />

      <Pressable
        testID="create-night-fab"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/(app)/nights/create')}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.base,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...Typography.bodyMedium,
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.primary,
    },
    list: {
      padding: Spacing.base,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: {
      backgroundColor: colors.surfacePressed,
      transform: [{ scale: 0.99 }],
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    cardTitle: {
      ...Typography.subheading,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    statusChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
    },
    statusText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      textTransform: 'capitalize',
      letterSpacing: 0,
    },
    cardDate: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    cardMeta: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    emptyContainer: {
      flex: 1,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['5xl'],
    },
    emptyText: {
      ...Typography.subheading,
      color: colors.textMuted,
    },
    emptySubtext: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: Spacing.sm,
    },
    errorBanner: {
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
    },
    errorText: {
      ...Typography.caption,
      color: colors.error,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: Spacing.xl,
      right: Spacing.xl,
      width: 56,
      height: 56,
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...Elevation.md,
    },
    fabPressed: {
      transform: [{ scale: 0.95 }],
    },
  });
}
