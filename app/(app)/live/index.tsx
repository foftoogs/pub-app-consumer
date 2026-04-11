import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/features/nights/store';
import { Itinerary, Night } from '@/features/nights/types';

function getCurrentStopIndex(itinerary: Itinerary[]): number {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  for (let i = itinerary.length - 1; i >= 0; i--) {
    const item = itinerary[i];
    if (item.estimated_arrival && hhmm >= item.estimated_arrival) {
      return i;
    }
  }
  // Default to first stop if no times match yet
  return 0;
}

function getActiveNight(nights: Night[]): Night | null {
  const active = nights.filter((n) => n.status === 'active');
  if (active.length === 0) return null;
  // Most recently updated if multiple
  return active.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
}

export default function LiveScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nights = useNightsStore((s) => s.nights);
  const activeNight = useMemo(() => getActiveNight(nights), [nights]);

  if (!activeNight) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="moon-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No active night</Text>
          <Text style={styles.emptySubtitle}>
            When a night is set to active, it will appear here as your live experience.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.push('/(app)/nights')}>
            <Text style={styles.backButtonText}>View Events</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentStopIndex = getCurrentStopIndex(activeNight.itinerary);

  const renderItineraryItem = ({ item, index }: { item: Itinerary; index: number }) => {
    const isCurrent = index === currentStopIndex;
    const isPast = index < currentStopIndex;

    return (
      <View
        testID={`live-stop-${index}`}
        style={[styles.stopCard, isCurrent && styles.stopCardCurrent]}
      >
        {/* Timeline connector */}
        <View style={styles.timeline}>
          {index > 0 && (
            <View
              style={[
                styles.timelineLineTop,
                isPast && styles.timelineLinePast,
                isCurrent && styles.timelineLineCurrent,
              ]}
            />
          )}
          <View
            style={[
              styles.timelineDot,
              isPast && styles.timelineDotPast,
              isCurrent && styles.timelineDotCurrent,
            ]}
          >
            {isCurrent && (
              <View style={styles.timelineDotInner} />
            )}
            {isPast && (
              <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
            )}
          </View>
          {index < activeNight.itinerary.length - 1 && (
            <View
              style={[
                styles.timelineLineBottom,
                isPast && styles.timelineLinePast,
              ]}
            />
          )}
        </View>

        {/* Stop content */}
        <View style={styles.stopContent}>
          <View style={styles.stopHeader}>
            <Text style={styles.stopNumber}>Stop {index + 1}</Text>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <View style={styles.currentDot} />
                <Text style={styles.currentBadgeText}>Now</Text>
              </View>
            )}
          </View>
          <Text style={[styles.stopName, isCurrent && styles.stopNameCurrent]}>
            {item.venue.name}
          </Text>
          {item.venue.suburb && (
            <Text style={styles.stopSuburb}>{item.venue.suburb}</Text>
          )}
          {(item.estimated_arrival || item.estimated_departure) && (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.timeText}>
                {item.estimated_arrival ?? '?'}
                {' — '}
                {item.estimated_departure ?? '?'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>LIVE</Text>
        </View>
        <Text style={styles.headerTitle}>{activeNight.name}</Text>
        <Text style={styles.headerDate}>{activeNight.date}</Text>
      </View>

      {/* Itinerary timeline */}
      {activeNight.itinerary.length > 0 ? (
        <FlatList
          data={activeNight.itinerary}
          keyExtractor={(item) => item.id}
          renderItem={renderItineraryItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.noStops}>
          <Text style={styles.noStopsText}>No venues in the itinerary yet</Text>
        </View>
      )}

      {/* Future feature placeholders */}
      <View style={styles.futureSection}>
        <Text style={styles.futureSectionTitle}>Coming Soon</Text>
        <View style={styles.futureGrid}>
          {[
            { icon: 'location', label: 'Check-in' },
            { icon: 'chatbubbles', label: 'Group Chat' },
            { icon: 'card', label: 'Split Bill' },
            { icon: 'camera', label: 'Photos' },
          ].map((feature) => (
            <View key={feature.label} style={styles.futureCard}>
              <Ionicons name={`${feature.icon}-outline` as any} size={24} color={colors.textMuted} />
              <Text style={styles.futureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    emptyTitle: {
      ...Typography.h3,
      color: colors.text,
      marginTop: Spacing.base,
    },
    emptySubtitle: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
      maxWidth: 280,
    },
    backButton: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
    },
    backButtonText: {
      ...Typography.bodySemibold,
      color: colors.textOnPrimary,
    },

    // Header
    header: {
      padding: Spacing.base,
      paddingTop: Spacing['3xl'],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.live,
    },
    liveLabel: {
      ...Typography.label,
      color: colors.live,
      letterSpacing: 1.5,
      fontWeight: '700',
    },
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    headerDate: {
      ...Typography.body,
      color: colors.textMuted,
      marginTop: 2,
    },

    // Itinerary list
    list: {
      padding: Spacing.base,
    },
    stopCard: {
      flexDirection: 'row',
      minHeight: 80,
    },
    stopCardCurrent: {
      // subtle glow background for current stop
    },

    // Timeline
    timeline: {
      width: 32,
      alignItems: 'center',
    },
    timelineLineTop: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
    },
    timelineLineBottom: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
    },
    timelineLinePast: {
      backgroundColor: colors.primary,
    },
    timelineLineCurrent: {
      backgroundColor: colors.primary,
    },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timelineDotPast: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timelineDotCurrent: {
      backgroundColor: colors.live,
      borderColor: colors.live,
      borderWidth: 3,
    },
    timelineDotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textOnPrimary,
    },

    // Stop content
    stopContent: {
      flex: 1,
      paddingLeft: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    stopHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    stopNumber: {
      ...Typography.label,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.live,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.xs,
    },
    currentDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textOnPrimary,
    },
    currentBadgeText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      fontWeight: '700',
      fontSize: 10,
    },
    stopName: {
      ...Typography.bodySemibold,
      color: colors.text,
      marginTop: 2,
    },
    stopNameCurrent: {
      color: colors.live,
    },
    stopSuburb: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.xs,
    },
    timeText: {
      ...Typography.caption,
      color: colors.textMuted,
    },

    // No stops
    noStops: {
      padding: Spacing['2xl'],
      alignItems: 'center',
    },
    noStopsText: {
      ...Typography.body,
      color: colors.textMuted,
    },

    // Future features
    futureSection: {
      padding: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    futureSectionTitle: {
      ...Typography.label,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    futureGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    futureCard: {
      flex: 1,
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceAlt,
      gap: Spacing.xs,
    },
    futureLabel: {
      ...Typography.caption,
      color: colors.textMuted,
    },
  });
}
