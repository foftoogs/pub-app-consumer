import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';

export default function InviteAcceptScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { code } = useLocalSearchParams<{ code: string }>();
  const token = useAuthStore((s) => s.token);
  const setPendingInviteCode = useAuthStore((s) => s.setPendingInviteCode);
  const acceptInvite = useNightsStore((s) => s.acceptInvite);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!token) {
      setPendingInviteCode(code);
      router.replace('/(auth)/login');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const nightId = await acceptInvite(code);
      router.replace(`/(app)/nights/${nightId}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🎉</Text>
        </View>

        <Text style={styles.title}>You&apos;ve been invited!</Text>
        <Text style={styles.subtitle}>
          Someone wants you to join their night out.
          {!token ? ' Sign in to accept the invite and see the details.' : ' Tap below to join.'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={token ? 'Join this Night' : 'Sign in to Join'}
          onPress={handleJoin}
          loading={loading}
          fullWidth
        />

        {token && (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        )}
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
    iconText: {
      fontSize: 36,
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
