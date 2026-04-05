import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useNightsStore } from '@/stores/nights';
import { useAuthStore } from '@/stores/auth';

const STATUS_COLORS: Record<string, string> = {
  planning: '#3b82f6',
  active: '#22c55e',
  closed: '#9ca3af',
  cancelled: '#ef4444',
};

export default function NightOverviewScreen() {
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
      <View style={styles.header}>
        <Text style={styles.title}>{night.name}</Text>
        <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[night.status] }]}>
          <Text style={styles.statusText}>{night.status}</Text>
        </View>
      </View>

      {isOrganiser && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Organiser</Text>
        </View>
      )}

      <View style={styles.details}>
        <DetailRow label="Date" value={
          new Date(night.date).toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        } />
        {night.theme && <DetailRow label="Theme" value={night.theme} />}
        {night.budget != null && (
          <DetailRow label="Budget" value={`$${night.budget} per person`} />
        )}
        <DetailRow label="Members" value={String(night.members_count)} />
        <DetailRow label="Stops" value={String(night.itinerary_count)} />
      </View>

      {isOrganiser && night.status === 'planning' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Night</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  details: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
    color: '#999',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  actions: {
    marginTop: 40,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
