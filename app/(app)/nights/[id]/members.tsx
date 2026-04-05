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
} from 'react-native';
import { useNightsStore } from '@/stores/nights';
import { useAuthStore } from '@/stores/auth';
import { NightMember } from '@/types/night';

const RSVP_COLORS: Record<NightMember['rsvp_status'], string> = {
  going: '#22c55e',
  maybe: '#f59e0b',
  declined: '#ef4444',
};

const RSVP_OPTIONS: NightMember['rsvp_status'][] = ['going', 'maybe', 'declined'];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MembersScreen() {
  const night = useNightsStore((s) => s.currentNight);
  const addMember = useNightsStore((s) => s.addMember);
  const updateMemberRsvp = useNightsStore((s) => s.updateMemberRsvp);
  const removeMember = useNightsStore((s) => s.removeMember);
  const consumer = useAuthStore((s) => s.consumer);

  const [showAddInput, setShowAddInput] = useState(false);
  const [consumerId, setConsumerId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  if (!night) return null;

  const isOrganiser = night.organiser.id === consumer?.id;

  const handleAddMember = async () => {
    if (!consumerId.trim()) return;
    setAddError('');
    setAddLoading(true);
    try {
      await addMember(night.id, consumerId.trim());
      setConsumerId('');
      setShowAddInput(false);
    } catch (err: any) {
      setAddError(err.response?.data?.message ?? 'Failed to add member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = (member: NightMember) => {
    Alert.alert('Remove Member', `Remove ${member.consumer.name} from this night?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMember(member.id),
      },
    ]);
  };

  const handleRsvpChange = (member: NightMember, status: NightMember['rsvp_status']) => {
    updateMemberRsvp(member.id, status);
  };

  const renderMember = ({ item }: { item: NightMember }) => (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.consumer.name)}</Text>
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>{item.consumer.name}</Text>
          {item.role === 'organiser' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Organiser</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail}>{item.consumer.email}</Text>

        {isOrganiser ? (
          <View style={styles.rsvpRow}>
            {RSVP_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.rsvpOption,
                  item.rsvp_status === status && {
                    backgroundColor: RSVP_COLORS[status],
                  },
                ]}
                onPress={() => handleRsvpChange(item, status)}
              >
                <Text
                  style={[
                    styles.rsvpOptionText,
                    item.rsvp_status === status && styles.rsvpOptionTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.rsvpChip, { backgroundColor: RSVP_COLORS[item.rsvp_status] }]}>
            <Text style={styles.rsvpChipText}>{item.rsvp_status}</Text>
          </View>
        )}
      </View>

      {isOrganiser && item.role !== 'organiser' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item)}
        >
          <Text style={styles.removeButtonText}>x</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={night.members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
      />

      {isOrganiser && (
        <View style={styles.addSection}>
          {showAddInput ? (
            <View>
              <TextInput
                style={styles.addInput}
                placeholder="Consumer ID"
                placeholderTextColor="#999"
                value={consumerId}
                onChangeText={setConsumerId}
                autoFocus
              />
              {addError ? <Text style={styles.addError}>{addError}</Text> : null}
              <View style={styles.addButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddInput(false);
                    setConsumerId('');
                    setAddError('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addConfirmButton, (!consumerId.trim() || addLoading) && styles.buttonDisabled]}
                  onPress={handleAddMember}
                  disabled={!consumerId.trim() || addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.addConfirmText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddInput(true)}
            >
              <Text style={styles.addButtonText}>+ Add Member</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  rsvpOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rsvpOptionText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  rsvpOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  rsvpChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  rsvpChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    paddingTop: 60,
    alignItems: 'center',
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
  addInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 8,
  },
  addError: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 8,
  },
  addButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
  },
  addConfirmButton: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  addConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
