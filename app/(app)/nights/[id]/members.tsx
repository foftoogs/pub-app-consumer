import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/stores/auth';
import { useNightsStore } from '@/stores/nights';
import { NightMember } from '@/types/night';

const RSVP_OPTIONS: NightMember['rsvp_status'][] = ['going', 'maybe', 'declined'];

function rsvpColor(colors: ThemeColors, status: NightMember['rsvp_status']) {
  switch (status) {
    case 'going':
      return colors.success;
    case 'maybe':
      return colors.warning;
    case 'declined':
      return colors.error;
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MembersScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
            {RSVP_OPTIONS.map((status) => {
              const active = item.rsvp_status === status;
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.rsvpOption,
                    active && { backgroundColor: rsvpColor(colors, status), borderColor: rsvpColor(colors, status) },
                  ]}
                  onPress={() => handleRsvpChange(item, status)}
                >
                  <Text style={[styles.rsvpOptionText, active && styles.rsvpOptionTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.rsvpChip, { backgroundColor: rsvpColor(colors, item.rsvp_status) }]}>
            <Text style={styles.rsvpChipText}>{item.rsvp_status}</Text>
          </View>
        )}
      </View>

      {isOrganiser && item.role !== 'organiser' && (
        <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
          <Text style={styles.removeButtonText}>×</Text>
        </Pressable>
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
              <TextField
                placeholder="Consumer ID"
                value={consumerId}
                onChangeText={setConsumerId}
                autoFocus
                error={addError || undefined}
                containerStyle={styles.addField}
              />
              <View style={styles.addButtons}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowAddInput(false);
                    setConsumerId('');
                    setAddError('');
                  }}
                  style={styles.flexButton}
                />
                <Button
                  label="Add"
                  onPress={handleAddMember}
                  disabled={!consumerId.trim()}
                  loading={addLoading}
                  style={styles.flexButton}
                />
              </View>
            </View>
          ) : (
            <Button label="+ Add Member" onPress={() => setShowAddInput(true)} fullWidth />
          )}
        </View>
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
    list: {
      padding: Spacing.base,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    avatarText: {
      ...Typography.bodySemibold,
      color: colors.primary,
    },
    memberInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    memberName: {
      ...Typography.bodySemibold,
      color: colors.text,
    },
    memberEmail: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    roleBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.xs,
    },
    roleBadgeText: {
      ...Typography.label,
      color: colors.primary,
      letterSpacing: 0.2,
    },
    rsvpRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
    },
    rsvpOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rsvpOptionText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    rsvpOptionTextActive: {
      color: colors.textOnPrimary,
      fontWeight: '600',
    },
    rsvpChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
      marginTop: Spacing.sm,
    },
    rsvpChipText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      textTransform: 'capitalize',
      letterSpacing: 0,
    },
    removeButton: {
      padding: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    removeButtonText: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '600',
    },
    empty: {
      paddingTop: Spacing['4xl'],
      alignItems: 'center',
    },
    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
    },
    addSection: {
      padding: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addField: {
      marginBottom: Spacing.sm,
    },
    addButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    flexButton: {
      flex: 1,
    },
  });
}
