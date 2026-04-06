import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useNightsStore } from '@/stores/nights';

export default function InviteAcceptScreen() {
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

        <Text style={styles.title}>You've been invited!</Text>
        <Text style={styles.subtitle}>
          Someone wants you to join their night out.
          {!token ? ' Sign in to accept the invite and see the details.' : ' Tap below to join.'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {token ? 'Join this Night' : 'Sign in to Join'}
            </Text>
          )}
        </TouchableOpacity>

        {token && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
