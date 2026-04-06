import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useNightsStore } from '@/stores/nights';
import { useAuthStore } from '@/stores/auth';
import { Itinerary, Venue } from '@/types/night';

export default function ItineraryScreen() {
  const night = useNightsStore((s) => s.currentNight);
  const venues = useNightsStore((s) => s.venues);
  const venuesLoading = useNightsStore((s) => s.venuesLoading);
  const fetchVenues = useNightsStore((s) => s.fetchVenues);
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

  if (!night) return null;

  const isOrganiser = night.organiser.id === consumer?.id;
  const isPlanning = night.status === 'planning';
  const canEdit = isOrganiser && isPlanning;
  const sortedItinerary = [...night.itinerary].sort((a, b) => a.order - b.order);

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

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
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
    const itemIds = data.map((item) => item.id);
    reorderItinerary(night.id, itemIds);
  };

  const renderItineraryItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Itinerary>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={canEdit ? drag : undefined}
          disabled={isActive}
          style={[styles.card, isActive && styles.cardActive]}
        >
          <View style={styles.cardLeft}>
            <View style={styles.stopBadge}>
              <Text style={styles.stopBadgeText}>{index + 1}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.venueName}>{item.venue.name}</Text>
            {item.venue.suburb && (
              <Text style={styles.venueSuburb}>{item.venue.suburb}</Text>
            )}
            <View style={styles.timeRow}>
              {item.estimated_arrival && (
                <Text style={styles.timeText}>Arrive: {item.estimated_arrival}</Text>
              )}
              {item.estimated_departure && (
                <Text style={styles.timeText}>Depart: {item.estimated_departure}</Text>
              )}
              {!item.estimated_arrival && !item.estimated_departure && (
                <Text style={styles.timeTextMuted}>No times set</Text>
              )}
            </View>
          </View>

          {canEdit && (
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item)}>
              <Text style={styles.removeButtonText}>x</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const filteredVenues = venues.filter(
    (v) => !night.itinerary.some((i) => i.venue.id === v.id)
  );

  const renderVenueOption = ({ item }: { item: Venue }) => {
    const isSelected = selectedVenue?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.venueOption, isSelected && styles.venueOptionSelected]}
        onPress={() => handleSelectVenue(item)}
      >
        <Text style={[styles.venueOptionName, isSelected && styles.venueOptionNameSelected]}>
          {item.name}
        </Text>
        {item.suburb && (
          <Text style={[styles.venueOptionSuburb, isSelected && styles.venueOptionSuburbSelected]}>
            {item.suburb}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {sortedItinerary.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No venues added yet</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={sortedItinerary}
          keyExtractor={(item) => item.id}
          renderItem={renderItineraryItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.list}
          activationDistance={canEdit ? 0 : 10000}
        />
      )}

      {canEdit && (
        <View style={styles.addSection}>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenVenuePicker}>
            <Text style={styles.addButtonText}>+ Add Venue</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showVenuePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVenuePicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Venue</Text>
            <TouchableOpacity
              onPress={handleAddVenue}
              disabled={!selectedVenue || addLoading}
            >
              {addLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  style={[styles.modalDone, (!selectedVenue || addLoading) && styles.modalDoneDisabled]}
                >
                  Add
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {addError ? <Text style={styles.addError}>{addError}</Text> : null}

          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
            placeholderTextColor="#999"
            value={venueSearch}
            onChangeText={handleSearchVenues}
            autoFocus
          />

          {selectedVenue && (
            <View style={styles.timeInputs}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Arrival (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="18:00"
                  placeholderTextColor="#ccc"
                  value={arrivalTime}
                  onChangeText={setArrivalTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Departure (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="20:00"
                  placeholderTextColor="#ccc"
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          )}

          {venuesLoading && venues.length === 0 ? (
            <ActivityIndicator style={styles.venuesLoader} size="large" color="#999" />
          ) : (
            <FlatList
              data={filteredVenues}
              keyExtractor={(item) => item.id}
              renderItem={renderVenueOption}
              contentContainerStyle={styles.venueList}
              ListEmptyComponent={
                <View style={styles.empty}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardActive: {
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardLeft: {
    marginRight: 12,
  },
  stopBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
  },
  venueSuburb: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  timeTextMuted: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  addSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addError: {
    color: '#e74c3c',
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalDoneDisabled: {
    opacity: 0.3,
  },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  timeInputs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  venueList: {
    paddingHorizontal: 16,
  },
  venueOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  venueOptionSelected: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  venueOptionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  venueOptionNameSelected: {
    fontWeight: '600',
  },
  venueOptionSuburb: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  venueOptionSuburbSelected: {
    color: '#666',
  },
  venuesLoader: {
    marginTop: 40,
  },
});
