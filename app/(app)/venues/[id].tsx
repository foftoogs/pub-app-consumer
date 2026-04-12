import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVenuesStore } from '@/features/venues/store';
import { VenueAvailability } from '@/features/nights/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function todayDay(): string {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function priceTierLabel(tier: number | null): string {
  if (!tier) return '';
  return '$'.repeat(tier);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentVenue, availability, loading, error, fetchVenue, fetchAvailability } = useVenuesStore();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) fetchVenue(id);
  }, [id]);

  useEffect(() => {
    if (id) fetchAvailability(id, selectedDate);
  }, [id, selectedDate]);

  if (loading && !currentVenue) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !currentVenue) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentVenue) return null;

  const venue = currentVenue;
  const today = todayDay();

  const openDirections = () => {
    if (!venue.latitude || !venue.longitude) return;
    const url = Platform.select({
      ios: `maps:?daddr=${venue.latitude},${venue.longitude}`,
      android: `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${venue.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const dateTabs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {venue.cover_image_url ? (
        <Image source={{ uri: venue.cover_image_url }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Ionicons name="business" size={48} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.name}>{venue.name}</Text>
          {venue.price_tier && (
            <Text style={styles.price}>{priceTierLabel(venue.price_tier)}</Text>
          )}
        </View>
        <View style={styles.headerMeta}>
          {venue.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{venue.type}</Text>
            </View>
          )}
          {venue.suburb && <Text style={styles.metaText}>{venue.suburb}</Text>}
          {venue.capacity && <Text style={styles.metaText}>{venue.capacity} capacity</Text>}
        </View>
      </View>

      {venue.vibe_tags && venue.vibe_tags.length > 0 && (
        <View style={styles.section}>
          <View style={styles.vibeTags}>
            {venue.vibe_tags.map((tag) => (
              <View key={tag} style={styles.vibeChip}>
                <Text style={styles.vibeChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {venue.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{venue.description}</Text>
        </View>
      )}

      {venue.dress_code && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dress Code</Text>
          <View style={styles.infoRow}>
            <Ionicons name="shirt-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{venue.dress_code}</Text>
          </View>
        </View>
      )}

      {venue.opening_hours && Object.keys(venue.opening_hours).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          {DAYS.map((day) => {
            const hours = venue.opening_hours?.[day];
            const isToday = day === today;
            return (
              <View key={day} style={[styles.hoursRow, isToday && styles.hoursRowToday]}>
                <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Text style={[styles.hoursTime, isToday && styles.hoursTimeToday]}>
                  {hours ? `${hours.open} – ${hours.close}` : 'Closed'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateTabs}>
          {dateTabs.map((date) => (
            <Pressable
              key={date}
              style={[styles.dateTab, selectedDate === date && styles.dateTabActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateTabText, selectedDate === date && styles.dateTabTextActive]}>
                {formatDate(date)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {availability.length > 0 ? (
          <View style={styles.slots}>
            {availability.map((slot: VenueAvailability) => (
              <View key={slot.id} style={styles.slot}>
                <Text style={styles.slotTime}>{slot.time_slot}</Text>
                <Text style={[styles.slotSpots, slot.spots_remaining === 0 && styles.slotFull]}>
                  {slot.spots_remaining === 0 ? 'Full' : `${slot.spots_remaining} spots`}
                </Text>
                {slot.notes && <Text style={styles.slotNotes}>{slot.notes}</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noSlots}>No availability for this date</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        {venue.address && (
          <Pressable style={styles.contactRow} onPress={openDirections}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>
              {[venue.address, venue.suburb, venue.state, venue.postcode].filter(Boolean).join(', ')}
            </Text>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          </Pressable>
        )}
        {venue.phone && (
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`tel:${venue.phone}`)}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>{venue.phone}</Text>
          </Pressable>
        )}
        {venue.email && (
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${venue.email}`)}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>{venue.email}</Text>
          </Pressable>
        )}
      </View>
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
      paddingBottom: Spacing['3xl'],
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },
    errorText: {
      ...Typography.body,
      color: colors.error,
      textAlign: 'center',
    },
    hero: {
      width: '100%',
      height: 200,
    },
    heroPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      padding: Spacing.base,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      ...Typography.heading,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    price: {
      ...Typography.subheading,
      color: colors.success,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    typeBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.sm,
    },
    typeBadgeText: {
      ...Typography.caption,
      color: colors.primary,
      textTransform: 'capitalize',
    },
    metaText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    section: {
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      ...Typography.bodyMedium,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    description: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    vibeTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    vibeChip: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
    },
    vibeChipText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    infoText: {
      ...Typography.body,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    hoursRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
    },
    hoursRowToday: {
      backgroundColor: colors.surfaceAlt,
      marginHorizontal: -Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.sm,
    },
    hoursDay: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    hoursDayToday: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    hoursTime: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    hoursTimeToday: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    dateTabs: {
      marginBottom: Spacing.md,
    },
    dateTab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: Spacing.sm,
    },
    dateTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateTabText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    dateTabTextActive: {
      color: colors.textOnPrimary,
    },
    slots: {
      gap: Spacing.sm,
    },
    slot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    slotTime: {
      ...Typography.bodyMedium,
      color: colors.text,
      minWidth: 100,
    },
    slotSpots: {
      ...Typography.body,
      color: colors.success,
    },
    slotFull: {
      color: colors.error,
    },
    slotNotes: {
      ...Typography.caption,
      color: colors.textMuted,
      flex: 1,
      textAlign: 'right',
    },
    noSlots: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contactText: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
  });
}
