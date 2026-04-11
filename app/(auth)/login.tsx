import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityscapeIllustration } from '@/components/ui/cityscape-illustration';
import { NitePoolLogo } from '@/components/ui/nitepool-logo';
import { TextField } from '@/components/ui/text-field';
import { Gradients, Palette } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import api from '@/lib/api';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/consumer/auth/request-otp', { email });
      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong');
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
        {/* Bottom illustration — rendered first so it sits behind the form */}
        <View style={styles.illustrationContainer}>
          <CityscapeIllustration height={200} />
        </View>

        <View style={[styles.content, { paddingTop: insets.top + Spacing['2xl'] }]}>
          {/* Logo + brand */}
          <View style={styles.brandSection}>
            <NitePoolLogo size={140} color="#FFFFFF" />
            <Text style={styles.brandName}>NITEPOOL</Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>LOG IN</Text>

            <TextField
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error || undefined}
              containerStyle={styles.field}
            />

            <GradientButton
              label={loading ? 'Sending...' : 'Send code'}
              onPress={handleSendCode}
              disabled={!email || loading}
            />
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
    marginBottom: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.base,
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
  illustrationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
