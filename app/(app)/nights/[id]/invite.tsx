import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNightsStore } from '@/stores/nights';
import { useAuthStore } from '@/stores/auth';
import { NightInvite } from '@/types/night';

const STATUS_COLORS: Record<NightInvite['status'], string> = {
  pending: '#3b82f6',
  used: '#22c55e',
  expired: '#9ca3af',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildInviteLink(code: string) {
  return `nightout://invite/${code}`;
}

export default function InviteScreen() {
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
        <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusChipText}>{item.status}</Text>
        </View>
        <Text style={styles.inviteDate}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.inviteCode}>{buildInviteLink(item.invite_code)}</Text>

      {item.expires_at && (
        <Text style={styles.expiryText}>Expires: {formatDate(item.expires_at)}</Text>
      )}

      {item.accepted_by && (
        <Text style={styles.acceptedText}>
          Accepted by {item.accepted_by.name}
        </Text>
      )}

      {item.status === 'pending' && (
        <TouchableOpacity style={styles.copyButton} onPress={() => handleCopy(item)}>
          <Text style={styles.copyButtonText}>
            {copiedId === item.id ? 'Copied!' : 'Copy Link'}
          </Text>
        </TouchableOpacity>
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

            <TouchableOpacity
              style={[styles.generateButton, generating && styles.buttonDisabled]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Invite Link</Text>
              )}
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  error: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  inviteCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  inviteDate: {
    fontSize: 12,
    color: '#999',
  },
  inviteCode: {
    fontSize: 13,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 6,
  },
  expiryText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  acceptedText: {
    fontSize: 12,
    color: '#22c55e',
    marginBottom: 4,
  },
  copyButton: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptyList: {
    paddingTop: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 15,
    color: '#999',
  },
});
