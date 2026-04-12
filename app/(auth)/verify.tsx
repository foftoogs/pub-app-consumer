import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityscapeIllustration } from '@/components/ui/cityscape-illustration';
import { NitePoolLogo } from '@/components/ui/nitepool-logo';
import { TextField } from '@/components/ui/text-field';
import { Gradients, Palette } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
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

      router.replace('/(app)/home');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={Gradients.brand}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Cityscape behind the logo */}
        <View style={styles.illustrationContainer}>
          <CityscapeIllustration height={460} />
        </View>

        <View style={[styles.content, { paddingTop: insets.top + Spacing['2xl'] }]}>
          {/* Logo + brand */}
          <View style={styles.brandSection}>
            <NitePoolLogo size={140} color="#FFFFFF" />
            <Text style={styles.brandName}>NITEPOOL</Text>
          </View>

          {/* Verify card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CHECK YOUR EMAIL</Text>
            <Text style={styles.cardSubtitle}>
              We sent a 6-digit code to {email}
            </Text>

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

            <GradientButton
              label={loading ? 'Verifying...' : 'Verify'}
              onPress={handleVerify}
              disabled={code.length !== 6 || loading}
            />

            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Use a different email</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/** Gradient CTA button matching the pink → orange design. */
function GradientButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <LinearGradient
      colors={disabled ? ['#9CA3AF', '#9CA3AF'] : [...Gradients.ctaButton]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.gradientButton, disabled && styles.buttonDisabled]}
    >
      <Text
        style={styles.gradientButtonLabel}
        onPress={disabled ? undefined : onPress}
      >
        {label}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  brandName: {
    ...Typography.heading,
    color: '#FFFFFF',
    letterSpacing: 4,
    marginTop: Spacing.md,
    fontWeight: '800',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  cardTitle: {
    ...Typography.displayMedium,
    color: Palette.midnight[800],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    ...Typography.body,
    color: Palette.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.base,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  gradientButton: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  gradientButtonLabel: {
    ...Typography.button,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    marginTop: Spacing.base,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    ...Typography.caption,
    color: Palette.neutral[500],
  },
  illustrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
