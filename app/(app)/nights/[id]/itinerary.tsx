import { useState } from 'react';
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

const MAX_VENUES = 3;

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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...sortedItinerary];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderItinerary(night.id, newOrder.map((i) => i.id));
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedItinerary.length - 1) return;
    const newOrder = [...sortedItinerary];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderItinerary(night.id, newOrder.map((i) => i.id));
  };

  const handleDragEnd = ({ data }: { data: Itinerary[] }) => {
    reorderItinerary(night.id, data.map((i) => i.id));
  };

  const filteredVenues = venues.filter(
    (v) => !night.itinerary.some((i) => i.venue.id === v.id)
  );

  const renderVenueOption = ({ item }: { item: Venue }) => {
    const isSelected = selectedVenue?.id === item.id;
    return (
      <TouchableOpacity
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
      </TouchableOpacity>
    );
  };

  const emptySlotCount = canEdit ? MAX_VENUES - sortedItinerary.length : 0;

  const renderDraggableItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Itinerary>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
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
              {item.venue.suburb && (
                <Text style={styles.venueSuburb}>{item.venue.suburb}</Text>
              )}
            </View>
            {canEdit && (
              <View style={styles.cardActions}>
                <View style={styles.dragHandle}>
                  <Text style={styles.dragHandleText}>☰</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item)}>
                  <Text style={styles.removeButtonText}>x</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {item.venue.address && (
            <Text style={styles.venueAddress}>{item.venue.address}</Text>
          )}

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
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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
              <TouchableOpacity style={styles.emptySlot} onPress={handleOpenVenuePicker}>
                <View style={styles.emptyStopBadge}>
                  <Text style={styles.emptyStopBadgeText}>{slotIndex + 1}</Text>
                </View>
                <Text style={styles.emptySlotText}>+ Add venue</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slots: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 0,
  },
  connector: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
  },
  // Filled card
  card: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stopBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
  },
  venueSuburb: {
    fontSize: 14,
    color: '#999',
    marginTop: 1,
  },
  venueAddress: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    marginLeft: 54,
  },
  timesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginLeft: 54,
  },
  timeChip: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeChipLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timeChipValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 1,
  },
  noTimes: {
    fontSize: 13,
    color: '#ccc',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dragHandle: {
    padding: 8,
  },
  dragHandleText: {
    fontSize: 20,
    color: '#bbb',
  },
  cardDragging: {
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 0,
  },
  // Empty slot
  emptySlot: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 80,
  },
  emptyStopBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStopBadgeText: {
    color: '#bbb',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySlotText: {
    fontSize: 16,
    color: '#bbb',
    fontWeight: '500',
  },
  // Full empty state (non-organiser, no items)
  emptyFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // Modal styles
  addError: {
    color: '#e74c3c',
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 8,
  },
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
  emptyModal: {
    paddingTop: 40,
    alignItems: 'center',
  },
});
