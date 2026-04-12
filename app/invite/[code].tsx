import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';
import { Night } from '@/features/nights/types';

export default function InviteAcceptScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { code } = useLocalSearchParams<{ code: string }>();
  const token = useAuthStore((s) => s.token);
  const setPendingInviteCode = useAuthStore((s) => s.setPendingInviteCode);
  const acceptInvite = useNightsStore((s) => s.acceptInvite);
  const fetchInviteDetails = useNightsStore((s) => s.fetchInviteDetails);
  const respondToNight = useNightsStore((s) => s.respondToNight);

  const [night, setNight] = useState<Night | null>(null);
  const [inviterName, setInviterName] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [respondLoading, setRespondLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setDetailsLoading(false);
      return;
    }
    fetchInviteDetails(code)
      .then(({ invite, night: n }) => {
        setNight(n);
        setInviterName(invite.invited_by?.name ?? 'Someone');
      })
      .catch((err: any) => {
        setError(err.response?.data?.message ?? 'This invite is invalid or has expired.');
      })
      .finally(() => setDetailsLoading(false));
  }, [code, token]);

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>You&apos;ve been invited!</Text>
          <Text style={styles.subtitle}>Sign in to see the details and respond.</Text>
          <Button
            label="Sign in to Continue"
            onPress={() => {
              setPendingInviteCode(code);
              router.replace('/(auth)/login');
            }}
            fullWidth
          />
        </View>
      </View>
    );
  }

  const handleAcceptAndRespond = async (rsvpStatus: 'going' | 'maybe' | 'declined') => {
    setError('');
    setRespondLoading(rsvpStatus);
    try {
      if (!accepted) {
        const nightId = await acceptInvite(code);
        setAccepted(true);
        await respondToNight(nightId, rsvpStatus);
        router.replace(`/(app)/nights/${nightId}`);
      } else if (night) {
        await respondToNight(night.id, rsvpStatus);
        router.replace(`/(app)/nights/${night.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setRespondLoading(null);
    }
  };

  if (detailsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
        </View>

        <Text style={styles.title}>You&apos;re Invited</Text>

        {night ? (
          <View style={styles.nightCard}>
            <Text style={styles.nightName}>{night.name}</Text>
            <Text style={styles.nightDate}>{new Date(night.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.nightOrganiser}>Organised by {night.organiser.name}</Text>
            <View style={styles.nightStats}>
              <View style={styles.statChip}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{night.members_count} members</Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{night.itinerary_count} venues</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.subtitle}>{inviterName} wants you to join their night out.</Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.responseButtons}>
          <Button
            label="Join"
            onPress={() => handleAcceptAndRespond('going')}
            loading={respondLoading === 'going'}
            disabled={respondLoading !== null}
            fullWidth
          />
          <Button
            label="Maybe"
            variant="outline"
            onPress={() => handleAcceptAndRespond('maybe')}
            loading={respondLoading === 'maybe'}
            disabled={respondLoading !== null}
            fullWidth
          />
          <Button
            label="Decline"
            variant="outline"
            onPress={() => handleAcceptAndRespond('declined')}
            loading={respondLoading === 'declined'}
            disabled={respondLoading !== null}
            fullWidth
          />
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      ...Typography.displayMedium,
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing['2xl'],
    },
    nightCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing['2xl'],
      alignItems: 'center',
    },
    nightName: {
      ...Typography.title,
      color: colors.text,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    nightDate: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    nightOrganiser: {
      ...Typography.caption,
      color: colors.textMuted,
      marginBottom: Spacing.md,
    },
    nightStats: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },
    statText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    responseButtons: {
      width: '100%',
      gap: Spacing.sm,
    },
    error: {
      ...Typography.caption,
      color: colors.error,
      textAlign: 'center',
      marginBottom: Spacing.base,
    },
    backButton: {
      marginTop: Spacing.base,
      paddingVertical: Spacing.sm,
    },
    backButtonText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });
}
