import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { TextField } from '@/components/ui/text-field';
import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVenuesStore, type VenueFilters } from '@/features/venues/store';
import { Venue } from '@/features/nights/types';

const DEFAULT_REGION: Region = {
  latitude: -27.4698,
  longitude: 153.0251,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const VENUE_TYPES = ['bar', 'pub', 'club', 'restaurant', 'lounge', 'rooftop', 'brewery'];
const PRICE_TIERS = [
  { value: '1', label: '$' },
  { value: '2', label: '$$' },
  { value: '3', label: '$$$' },
  { value: '4', label: '$$$$' },
];

function priceTierLabel(tier: number | null): string {
  if (!tier) return '';
  return '$'.repeat(tier);
}

export default function VenuesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { venues, loading, filters, fetchVenues, setFilters } = useVenuesStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchVenues();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setMapRegion(region);
      }
    })();
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      const next = { ...filters, search: text || undefined };
      setFilters(next);
      fetchVenues(next);
    },
    [filters, fetchVenues, setFilters],
  );

  const toggleType = useCallback(
    (type: string) => {
      const next = { ...filters, type: filters.type === type ? undefined : type };
      setFilters(next);
      fetchVenues(next);
    },
    [filters, fetchVenues, setFilters],
  );

  const togglePrice = useCallback(
    (tier: string) => {
      const next = { ...filters, price_tier: filters.price_tier === tier ? undefined : tier };
      setFilters(next);
      fetchVenues(next);
    },
    [filters, fetchVenues, setFilters],
  );

  const hasActiveFilters = filters.type || filters.price_tier || filters.vibe;

  const clearFilters = useCallback(() => {
    const next: VenueFilters = search ? { search } : {};
    setFilters(next);
    fetchVenues(next);
  }, [search, setFilters, fetchVenues]);

  const renderVenue = useCallback(
    ({ item }: { item: Venue }) => (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/(app)/venues/${item.id}`)}
      >
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Ionicons name="business-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
            {item.price_tier && (
              <Text style={styles.priceTier}>{priceTierLabel(item.price_tier)}</Text>
            )}
          </View>
          <View style={styles.cardMeta}>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            )}
            {item.suburb && (
              <Text style={styles.suburb}>{item.suburb}</Text>
            )}
            {item.distance != null && (
              <Text style={styles.distance}>{item.distance} km</Text>
            )}
          </View>
          {item.vibe_tags && item.vibe_tags.length > 0 && (
            <View style={styles.vibeTags}>
              {item.vibe_tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.vibeChip}>
                  <Text style={styles.vibeChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {item.description && (
            <Text style={styles.venueDesc} numberOfLines={2}>{item.description}</Text>
          )}
        </View>
      </Pressable>
    ),
    [styles, colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <TextField
              placeholder="Search venues..."
              value={search}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              variant="filled"
            />
          </View>
          <Pressable
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Ionicons
              name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {VENUE_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.filterChip, filters.type === type && styles.filterChipActive]}
              onPress={() => toggleType(type)}
            >
              <Text style={[styles.filterChipText, filters.type === type && styles.filterChipTextActive]}>
                {type}
              </Text>
            </Pressable>
          ))}
          <View style={styles.filterDivider} />
          {PRICE_TIERS.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.filterChip, filters.price_tier === value && styles.filterChipActive]}
              onPress={() => togglePrice(value)}
            >
              <Text style={[styles.filterChipText, filters.price_tier === value && styles.filterChipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
          {hasActiveFilters && (
            <Pressable style={styles.clearChip} onPress={clearFilters}>
              <Ionicons name="close-circle" size={14} color={colors.error} />
              <Text style={styles.clearChipText}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={renderVenue}
          contentContainerStyle={venues.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchVenues()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {hasActiveFilters || search ? 'No venues match your filters' : 'No venues available'}
                </Text>
                {(hasActiveFilters || search) && (
                  <Pressable onPress={() => { setSearch(''); clearFilters(); }}>
                    <Text style={styles.clearLink}>Clear all filters</Text>
                  </Pressable>
                )}
              </View>
            ) : null
          }
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {venues
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((venue) => (
              <Marker
                key={venue.id}
                coordinate={{ latitude: venue.latitude!, longitude: venue.longitude! }}
                title={venue.name}
              >
                <Callout onPress={() => router.push(`/(app)/venues/${venue.id}`)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName}>{venue.name}</Text>
                    <View style={styles.calloutMeta}>
                      {venue.type && <Text style={styles.calloutType}>{venue.type}</Text>}
                      {venue.price_tier && <Text style={styles.calloutPrice}>{priceTierLabel(venue.price_tier)}</Text>}
                    </View>
                    <Text style={styles.calloutHint}>Tap for details</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
        </MapView>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchBar: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    searchField: {
      flex: 1,
    },
    viewToggle: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterBar: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterScroll: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.md,
      gap: Spacing.sm,
      alignItems: 'center',
    },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      ...Typography.label,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    filterChipTextActive: {
      color: colors.textOnPrimary,
    },
    filterDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
    },
    clearChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    clearChipText: {
      ...Typography.label,
      color: colors.error,
    },
    list: {
      padding: Spacing.base,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...Elevation.sm,
    },
    coverImage: {
      width: '100%',
      height: 140,
    },
    coverPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardBody: {
      padding: Spacing.base,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    venueName: {
      ...Typography.subheading,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    priceTier: {
      ...Typography.bodyMedium,
      color: colors.success,
    },
    cardMeta: {
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
    suburb: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    distance: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    vibeTags: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      flexWrap: 'wrap',
    },
    vibeChip: {
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.full,
    },
    vibeChipText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    venueDesc: {
      ...Typography.body,
      color: colors.textMuted,
      marginTop: Spacing.sm,
    },
    emptyContainer: {
      flex: 1,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['5xl'],
      gap: Spacing.md,
    },
    emptyText: {
      ...Typography.subheading,
      color: colors.textMuted,
      textAlign: 'center',
    },
    clearLink: {
      ...Typography.bodyMedium,
      color: colors.primary,
    },
    map: {
      flex: 1,
    },
    callout: {
      padding: Spacing.sm,
      minWidth: 150,
    },
    calloutName: {
      ...Typography.bodyMedium,
      color: '#000',
    },
    calloutMeta: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: 2,
    },
    calloutType: {
      ...Typography.caption,
      color: '#666',
      textTransform: 'capitalize',
    },
    calloutPrice: {
      ...Typography.caption,
      color: '#4CAF50',
    },
    calloutHint: {
      ...Typography.caption,
      color: '#999',
      marginTop: 4,
    },
  });
}
