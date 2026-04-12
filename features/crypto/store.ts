import { create } from 'zustand';
import api from '@/lib/api';
import {
  generateKeyPair,
  storeSecretKey,
  getStoredSecretKey,
  deleteStoredSecretKey,
  getOrCreateDeviceId,
} from '@/lib/crypto';
import { ConsumerKeyPair } from '@/features/crypto/types';

interface CryptoStore {
  keyPair: ConsumerKeyPair | null;
  hasSecretKey: boolean;
  loading: boolean;
  error: string | null;

  /**
   * Ensure this device has a registered key pair.
   * Generates keys if none exist, stores the secret locally,
   * and registers the public key with the server.
   */
  ensureKeyPair: () => Promise<void>;

  /**
   * Fetch another consumer's active public keys (for wrapping group keys).
   */
  fetchConsumerKeys: (consumerId: string) => Promise<ConsumerKeyPair[]>;

  /**
   * Revoke this device's key pair (e.g. on logout).
   */
  revokeKeyPair: () => Promise<void>;

  /**
   * Clear local crypto state without revoking server-side.
   */
  clearLocal: () => Promise<void>;
}

export const useCryptoStore = create<CryptoStore>((set, get) => ({
  keyPair: null,
  hasSecretKey: false,
  loading: false,
  error: null,

  ensureKeyPair: async () => {
    set({ loading: true, error: null });
    try {
      const deviceId = await getOrCreateDeviceId();

      // Check if we already have a secret key stored locally
      const existingSecret = await getStoredSecretKey();
      if (existingSecret) {
        // We have a secret key — check if server knows about this device
        const { data } = await api.get('/consumer/keys');
        const keys: ConsumerKeyPair[] = data.data ?? data;
        const deviceKey = keys.find((k: ConsumerKeyPair) => k.device_id === deviceId);
        if (deviceKey) {
          set({ keyPair: deviceKey, hasSecretKey: true });
          return;
        }
        // Server doesn't have our key for this device — re-register
      }

      // Generate fresh key pair
      const { publicKey, secretKey } = generateKeyPair();

      // Store secret key locally (never sent to server)
      await storeSecretKey(secretKey);

      // Register public key with server
      const { data } = await api.post('/consumer/keys', {
        public_key: publicKey,
        device_id: deviceId,
      });

      const registered: ConsumerKeyPair = data.data ?? data;
      set({ keyPair: registered, hasSecretKey: true });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to set up encryption keys' });
    } finally {
      set({ loading: false });
    }
  },

  fetchConsumerKeys: async (consumerId) => {
    const { data } = await api.get(`/consumer/consumers/${consumerId}/keys`);
    return data.data ?? data;
  },

  revokeKeyPair: async () => {
    const { keyPair } = get();
    if (keyPair) {
      try {
        await api.delete(`/consumer/keys/${keyPair.id}`);
      } catch {
        // Best effort — key may already be revoked
      }
    }
    await deleteStoredSecretKey();
    set({ keyPair: null, hasSecretKey: false });
  },

  clearLocal: async () => {
    await deleteStoredSecretKey();
    set({ keyPair: null, hasSecretKey: false, error: null });
  },
}));
