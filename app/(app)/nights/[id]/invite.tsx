import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';
import { NightInvite } from '@/features/nights/types';

function inviteStatusColor(colors: ThemeColors, status: NightInvite['status']) {
  switch (status) {
    case 'pending':
      return colors.info;
    case 'used':
      return colors.success;
    case 'expired':
      return colors.textMuted;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildInviteLink(code: string) {
  return `nightout://invite/${code}`;
}

export default function InviteScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const night = useNightsStore((s) => s.currentNight);
  const generateInvite = useNightsStore((s) => s.generateInvite);
  const consumer = useAuthStore((s) => s.consumer);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!night) return null;

  const isOrganiser = night.organiser.id === consumer?.id;

  if (!isOrganiser) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Only the organiser can manage invites</Text>
      </View>
    );
  }

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      await generateInvite(night.id);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to generate invite');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (invite: NightInvite) => {
    const link = buildInviteLink(invite.invite_code);
    await Clipboard.setStringAsync(link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderInvite = ({ item }: { item: NightInvite }) => (
    <View style={styles.inviteCard}>
      <View style={styles.inviteHeader}>
        <View style={[styles.statusChip, { backgroundColor: inviteStatusColor(colors, item.status) }]}>
          <Text style={styles.statusChipText}>{item.status}</Text>
        </View>
        <Text style={styles.inviteDate}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.inviteCode}>{buildInviteLink(item.invite_code)}</Text>

      {item.expires_at && (
        <Text style={styles.expiryText}>Expires: {formatDate(item.expires_at)}</Text>
      )}

      {item.accepted_by && (
        <Text style={styles.acceptedText}>Accepted by {item.accepted_by.name}</Text>
      )}

      {item.status === 'pending' && (
        <Pressable
          style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
          onPress={() => handleCopy(item)}
        >
          <Ionicons
            name={copiedId === item.id ? 'checkmark-circle' : 'copy-outline'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.copyButtonText}>
            {copiedId === item.id ? 'Copied!' : 'Copy Link'}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={night.invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInvite}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Invite Links</Text>
            <Text style={styles.headerSubtitle}>
              Generate a link to share with friends. Anyone with the link can join this night.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label="Generate Invite Link"
              onPress={handleGenerate}
              loading={generating}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>No invites yet</Text>
          </View>
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
    list: {
      padding: Spacing.base,
    },
    header: {
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      ...Typography.subheading,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.base,
    },
    error: {
      ...Typography.caption,
      color: colors.error,
      marginBottom: Spacing.md,
    },
    inviteCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
    },
    inviteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statusChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 3,
      borderRadius: Radius.sm,
    },
    statusChipText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      textTransform: 'capitalize',
      letterSpacing: 0,
    },
    inviteDate: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    inviteCode: {
      ...Typography.mono,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    expiryText: {
      ...Typography.caption,
      color: colors.textMuted,
      marginBottom: Spacing.xs,
    },
    acceptedText: {
      ...Typography.caption,
      color: colors.success,
      marginBottom: Spacing.xs,
    },
    copyButton: {
      marginTop: Spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.sm,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    copyButtonPressed: {
      backgroundColor: colors.surfacePressed,
    },
    copyButtonText: {
      ...Typography.buttonSmall,
      color: colors.primary,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
    },
    emptyList: {
      paddingTop: Spacing.lg,
      alignItems: 'center',
    },
    emptyListText: {
      ...Typography.bodyMedium,
      color: colors.textMuted,
    },
  });
}
