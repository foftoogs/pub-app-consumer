import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import * as Location from 'expo-location';

import { TextField } from '@/components/ui/text-field';
import VenueMap, { MapPin } from '@/components/ui/venue-map';
import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/stores/auth';
import { useNightsStore } from '@/stores/nights';
import { useVenuesStore } from '@/stores/venues';
import { Itinerary, Venue } from '@/types/night';

const MAX_VENUES = 3;

function filterAndSortVenues(
  venues: Venue[],
  night: { itinerary: Itinerary[] } | null,
  userLocation: { latitude: number; longitude: number } | null,
): Venue[] {
  const itinerary = night?.itinerary ?? [];
  const available = venues.filter(
    (v) => !itinerary.some((i) => i.venue.id === v.id)
  );
  if (!userLocation) return available;
  return [...available].sort((a, b) => {
    const distA = a.latitude != null && a.longitude != null
      ? Math.hypot(a.latitude - userLocation.latitude, a.longitude - userLocation.longitude)
      : Infinity;
    const distB = b.latitude != null && b.longitude != null
      ? Math.hypot(b.latitude - userLocation.latitude, b.longitude - userLocation.longitude)
      : Infinity;
    return distA - distB;
  });
}

export default function ItineraryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const night = useNightsStore((s) => s.currentNight);
  const venues = useVenuesStore((s) => s.venues);
  const venuesLoading = useVenuesStore((s) => s.loading);
  const fetchVenues = useVenuesStore((s) => s.fetchVenues);
  const addItineraryItem = useNightsStore((s) => s.addItineraryItem);
  const reorderItinerary = useNightsStore((s) => s.reorderItinerary);
  const removeItineraryItem = useNightsStore((s) => s.removeItineraryItem);
  const consumer = useAuthStore((s) => s.consumer);

  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  if (!night) return null;

  const isOrganiser = night.organiser.id === consumer?.id;
  const isPlanning = night.status === 'planning';
  const canEdit = isOrganiser && isPlanning;
  const sortedItinerary = [...night.itinerary].sort((a, b) => a.order - b.order);

  const itineraryPins: MapPin[] = sortedItinerary
    .filter((item) => item.venue.latitude != null && item.venue.longitude != null)
    .map((item, idx) => ({
      id: item.id,
      latitude: item.venue.latitude!,
      longitude: item.venue.longitude!,
      title: item.venue.name,
      label: String(idx + 1),
    }));

  const handleOpenVenuePicker = () => {
    setShowVenuePicker(true);
    setVenueSearch('');
    setSelectedVenue(null);
    setArrivalTime('');
    setDepartureTime('');
    setAddError('');
    fetchVenues();
  };

  const handleSearchVenues = (text: string) => {
    setVenueSearch(text);
    fetchVenues(text || undefined);
  };

  const handleAddVenue = async () => {
    if (!selectedVenue) return;
    setAddError('');
    setAddLoading(true);
    try {
      await addItineraryItem(night.id, {
        venue_id: selectedVenue.id,
        estimated_arrival: arrivalTime || undefined,
        estimated_departure: departureTime || undefined,
      });
      setShowVenuePicker(false);
    } catch (err: any) {
      setAddError(err.response?.data?.message ?? 'Failed to add venue');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = (item: Itinerary) => {
    Alert.alert('Remove Venue', `Remove ${item.venue.name} from the itinerary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeItineraryItem(night.id, item.id),
      },
    ]);
  };

  const handleDragEnd = ({ data }: { data: Itinerary[] }) => {
    reorderItinerary(
      night.id,
      data.map((i) => i.id)
    );
  };

  const filteredVenues = filterAndSortVenues(venues, night, userLocation);

  const pickerPins: MapPin[] = filteredVenues
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id: v.id,
      latitude: v.latitude!,
      longitude: v.longitude!,
      title: v.name,
      selected: selectedVenue?.id === v.id,
    }));

  const pickerMapRegion = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : undefined;

  const renderVenueOption = ({ item }: { item: Venue }) => {
    const isSelected = selectedVenue?.id === item.id;
    return (
      <Pressable
        style={[styles.venueOption, isSelected && styles.venueOptionSelected]}
        onPress={() => setSelectedVenue(item)}
      >
        <Text style={[styles.venueOptionName, isSelected && styles.venueOptionNameSelected]}>
          {item.name}
        </Text>
        {item.suburb && (
          <Text style={[styles.venueOptionSuburb, isSelected && styles.venueOptionSuburbSelected]}>
            {item.suburb}
          </Text>
        )}
      </Pressable>
    );
  };

  const emptySlotCount = canEdit ? MAX_VENUES - sortedItinerary.length : 0;

  const renderDraggableItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Itinerary>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={canEdit ? drag : undefined}
          disabled={isActive}
          style={[styles.card, isActive && styles.cardDragging]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.stopBadge}>
              <Text style={styles.stopBadgeText}>{index + 1}</Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.venueName}>{item.venue.name}</Text>
              {item.venue.suburb && <Text style={styles.venueSuburb}>{item.venue.suburb}</Text>}
            </View>
            {canEdit && (
              <View style={styles.cardActions}>
                <View testID={`drag-handle-${item.id}`} style={styles.dragHandle}>
                  <Ionicons name="reorder-three" size={22} color={colors.textMuted} />
                </View>
                <Pressable testID={`remove-itinerary-${item.id}`} style={styles.removeButton} onPress={() => handleRemove(item)}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </Pressable>
              </View>
            )}
          </View>

          {item.venue.address && <Text style={styles.venueAddress}>{item.venue.address}</Text>}

          <View style={styles.timesRow}>
            {item.estimated_arrival ? (
              <View style={styles.timeChip}>
                <Text style={styles.timeChipLabel}>Arrive</Text>
                <Text style={styles.timeChipValue}>{item.estimated_arrival}</Text>
              </View>
            ) : null}
            {item.estimated_departure ? (
              <View style={styles.timeChip}>
                <Text style={styles.timeChipLabel}>Depart</Text>
                <Text style={styles.timeChipValue}>{item.estimated_departure}</Text>
              </View>
            ) : null}
            {!item.estimated_arrival && !item.estimated_departure && (
              <Text style={styles.noTimes}>No times set</Text>
            )}
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {itineraryPins.length > 0 && (
        <View style={styles.mapSection}>
          <VenueMap
            testID="itinerary-map"
            pins={itineraryPins}
            height={200}
          />
        </View>
      )}
      <View style={styles.slots}>
        {sortedItinerary.length === 0 && !canEdit && (
          <View style={styles.emptyFull}>
            <Text style={styles.emptyText}>No venues added yet</Text>
          </View>
        )}

        {sortedItinerary.length > 0 && (
          <DraggableFlatList
            data={sortedItinerary}
            keyExtractor={(item) => item.id}
            renderItem={renderDraggableItem}
            onDragEnd={handleDragEnd}
            contentContainerStyle={styles.listContent}
            containerStyle={sortedItinerary.length < MAX_VENUES ? undefined : { flex: 1 }}
            activationDistance={canEdit ? 0 : 10000}
            ItemSeparatorComponent={() => (
              <View style={styles.connector}>
                <View style={styles.connectorLine} />
              </View>
            )}
          />
        )}

        {Array.from({ length: emptySlotCount }).map((_, i) => {
          const slotIndex = sortedItinerary.length + i;
          return (
            <View key={`empty-${slotIndex}`}>
              {(sortedItinerary.length > 0 || i > 0) && (
                <View style={styles.connector}>
                  <View style={styles.connectorLine} />
                </View>
              )}
              <Pressable style={styles.emptySlot} onPress={handleOpenVenuePicker}>
                <View style={styles.emptyStopBadge}>
                  <Text style={styles.emptyStopBadgeText}>{slotIndex + 1}</Text>
                </View>
                <Text style={styles.emptySlotText}>+ Add venue</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Modal visible={showVenuePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowVenuePicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Add Venue</Text>
            <Pressable onPress={handleAddVenue} disabled={!selectedVenue || addLoading}>
              {addLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.modalDone,
                    (!selectedVenue || addLoading) && styles.modalDoneDisabled,
                  ]}
                >
                  Add
                </Text>
              )}
            </Pressable>
          </View>

          {addError ? <Text style={styles.addError}>{addError}</Text> : null}

          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
            placeholderTextColor={colors.textMuted}
            value={venueSearch}
            onChangeText={handleSearchVenues}
            autoFocus
          />

          {pickerPins.length > 0 && (
            <View style={styles.pickerMapContainer}>
              <VenueMap
                testID="venue-picker-map"
                pins={pickerPins}
                initialRegion={pickerMapRegion}
                height={220}
                onPinPress={(pin) => {
                  const venue = filteredVenues.find((v) => v.id === pin.id);
                  if (venue) setSelectedVenue(venue);
                }}
              />
            </View>
          )}

          {selectedVenue && (
            <View style={styles.timeInputs}>
              <View style={styles.timeInputGroup}>
                <TextField
                  label="Arrival (HH:mm)"
                  placeholder="18:00"
                  value={arrivalTime}
                  onChangeText={setArrivalTime}
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
              </View>
              <View style={styles.timeInputGroup}>
                <TextField
                  label="Departure (HH:mm)"
                  placeholder="20:00"
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
              </View>
            </View>
          )}

          {venuesLoading && venues.length === 0 ? (
            <ActivityIndicator style={styles.venuesLoader} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={filteredVenues}
              keyExtractor={(item) => item.id}
              renderItem={renderVenueOption}
              contentContainerStyle={styles.venueList}
              ListEmptyComponent={
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyText}>No venues found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mapSection: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.base,
    },
    pickerMapContainer: {
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.md,
    },
    slots: {
      flex: 1,
      padding: Spacing.base,
      justifyContent: 'center',
    },
    connector: {
      alignItems: 'center',
      height: Spacing.lg,
      justifyContent: 'center',
    },
    connectorLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base + 2,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stopBadge: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md + 2,
    },
    stopBadgeText: {
      ...Typography.subheading,
      color: colors.textOnPrimary,
    },
    cardHeaderInfo: {
      flex: 1,
    },
    venueName: {
      ...Typography.subheading,
      color: colors.text,
    },
    venueSuburb: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 1,
    },
    venueAddress: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: Spacing.sm,
      marginLeft: 54,
    },
    timesRow: {
      flexDirection: 'row',
      gap: Spacing.md - 2,
      marginTop: Spacing.md,
      marginLeft: 54,
    },
    timeChip: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
    },
    timeChipLabel: {
      ...Typography.label,
      color: colors.textMuted,
    },
    timeChipValue: {
      ...Typography.bodySemibold,
      color: colors.text,
      marginTop: 1,
    },
    noTimes: {
      ...Typography.caption,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dragHandle: {
      padding: Spacing.sm,
    },
    cardDragging: {
      backgroundColor: colors.surfaceAlt,
      ...Elevation.lg,
    },
    removeButton: {
      padding: Spacing.sm,
    },
    listContent: {
      paddingBottom: 0,
    },
    emptySlot: {
      flex: 1,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      minHeight: 80,
    },
    emptyStopBadge: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStopBadgeText: {
      ...Typography.subheading,
      color: colors.textMuted,
    },
    emptySlotText: {
      ...Typography.body,
      color: colors.textMuted,
    },
    emptyFull: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
    },
    addError: {
      ...Typography.caption,
      color: colors.error,
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.sm,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalCancel: {
      ...Typography.button,
      color: colors.textSecondary,
    },
    modalTitle: {
      ...Typography.title,
      color: colors.text,
    },
    modalDone: {
      ...Typography.button,
      color: colors.primary,
    },
    modalDoneDisabled: {
      opacity: 0.35,
    },
    searchInput: {
      margin: Spacing.base,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md + 2,
      backgroundColor: colors.surface,
      color: colors.text,
      ...Typography.bodyMedium,
    },
    timeInputs: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.base,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    timeInputGroup: {
      flex: 1,
    },
    timeInput: {
      textAlign: 'center',
    },
    venueList: {
      paddingHorizontal: Spacing.base,
    },
    venueOption: {
      padding: Spacing.md + 2,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.sm,
      backgroundColor: colors.surface,
    },
    venueOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    venueOptionName: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    venueOptionNameSelected: {
      ...Typography.bodySemibold,
      color: colors.primary,
    },
    venueOptionSuburb: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    venueOptionSuburbSelected: {
      color: colors.textSecondary,
    },
    venuesLoader: {
      marginTop: Spacing['3xl'],
    },
    emptyModal: {
      paddingTop: Spacing['3xl'],
      alignItems: 'center',
    },
  });
}
