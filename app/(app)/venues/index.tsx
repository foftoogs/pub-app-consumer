import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TextField } from '@/components/ui/text-field';
import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVenuesStore } from '@/features/venues/store';
import { Venue } from '@/features/nights/types';

export default function VenuesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { venues, loading: venuesLoading, fetchVenues } = useVenuesStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      fetchVenues(text || undefined);
    },
    [fetchVenues]
  );

  const renderVenue = useCallback(
    ({ item }: { item: Venue }) => (
      <View style={styles.card}>
        <Text style={styles.venueName}>{item.name}</Text>
        {item.suburb && (
          <Text style={styles.venueSuburb}>{item.suburb}</Text>
        )}
        {item.description && (
          <Text style={styles.venueDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    ),
    [styles]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextField
          placeholder="Search venues..."
          value={search}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          variant="filled"
        />
      </View>

      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        renderItem={renderVenue}
        contentContainerStyle={venues.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={venuesLoading}
            onRefresh={() => fetchVenues(search || undefined)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !venuesLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {search ? 'No venues found' : 'No venues available'}
              </Text>
            </View>
          ) : null
        }
      />
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      ...Elevation.sm,
    },
    venueName: {
      ...Typography.subheading,
      color: colors.text,
    },
    venueSuburb: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
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
    },
    emptyText: {
      ...Typography.subheading,
      color: colors.textMuted,
    },
  });
}
