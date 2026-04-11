import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useNightsStore } from '@/stores/nights';

export default function VerifyScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const pendingInviteCode = useAuthStore((s) => s.pendingInviteCode);
  const setPendingInviteCode = useAuthStore((s) => s.setPendingInviteCode);
  const acceptInvite = useNightsStore((s) => s.acceptInvite);

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/consumer/auth/verify-otp', {
        email,
        code,
      });
      await setAuth(data.consumer, data.token);

      if (pendingInviteCode) {
        try {
          const nightId = await acceptInvite(pendingInviteCode);
          setPendingInviteCode(null);
          router.replace(`/(app)/nights/${nightId}`);
          return;
        } catch {
          setPendingInviteCode(null);
        }
      }

      router.replace('/(app)/nights');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

        <TextField
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.codeInput}
          error={error || undefined}
          containerStyle={styles.field}
        />

        <Button
          label="Verify"
          onPress={handleVerify}
          disabled={code.length !== 6}
          loading={loading}
          fullWidth
        />

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Use a different email</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    },
    title: {
      ...Typography.displayMedium,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing['2xl'],
    },
    field: {
      marginBottom: Spacing.base,
    },
    codeInput: {
      fontSize: 24,
      letterSpacing: 8,
      textAlign: 'center',
    },
    backButton: {
      marginTop: Spacing.base,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    backButtonText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });
}
