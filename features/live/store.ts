import { create } from 'zustand';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';
import {
  encryptForGroup,
  decryptFromGroup,
  unwrapGroupKey,
  getStoredSecretKey,
} from '@/lib/crypto';
import { useCryptoStore } from '@/features/crypto/store';
import {
  ConnectionStatus,
  DecryptedChatMessage,
  DecryptedLocationUpdate,
  EncryptedEventPayload,
  LiveEventType,
  PresenceMember,
} from '@/features/live/types';

interface LiveStore {
  nightId: string | null;
  connectionStatus: ConnectionStatus;
  groupKey: string | null;
  messages: DecryptedChatMessage[];
  memberLocations: Map<string, DecryptedLocationUpdate>;
  presenceMembers: PresenceMember[];
  error: string | null;

  /** Connect to a night's live channel, decrypt the group key, and start listening. */
  connect: (nightId: string) => Promise<void>;

  /** Disconnect and clean up. */
  disconnect: () => void;

  /** Send an encrypted chat message. */
  sendMessage: (text: string) => Promise<void>;

  /** Send an encrypted location update. */
  sendLocation: (latitude: number, longitude: number) => Promise<void>;

  /** Send a generic encrypted event. */
  sendEncryptedEvent: (type: LiveEventType, data: Record<string, unknown>) => Promise<void>;
}

let pusherInstance: Pusher | null = null;
let channelInstance: Channel | null = null;

export const useLiveStore = create<LiveStore>((set, get) => ({
  nightId: null,
  connectionStatus: 'disconnected',
  groupKey: null,
  messages: [],
  memberLocations: new Map(),
  presenceMembers: [],
  error: null,

  connect: async (nightId) => {
    // Clean up any existing connection
    get().disconnect();

    set({ nightId, connectionStatus: 'connecting', error: null, messages: [], presenceMembers: [] });

    try {
      // Fetch and unwrap the group key for this night
      const groupKeyData = await useNightsStore.getState().fetchGroupKey(nightId);
      const secretKey = await getStoredSecretKey();
      const myKeyPair = useCryptoStore.getState().keyPair;

      if (!secretKey || !myKeyPair) {
        throw new Error('Encryption keys not available.');
      }

      // To unwrap, we need the sender's (organiser's) public key
      // The organiser's public key is encoded in the group key wrapper
      // We need to know who wrapped it — fetch the organiser's key pair
      const night = useNightsStore.getState().currentNight;
      if (!night) throw new Error('Night not loaded.');

      const organiserKeys = await useCryptoStore
        .getState()
        .fetchConsumerKeys(night.organiser.id);

      if (organiserKeys.length === 0) {
        throw new Error('Organiser has no encryption keys.');
      }

      const groupKey = unwrapGroupKey(
        groupKeyData.wrapped_key,
        organiserKeys[0].public_key,
        secretKey,
      );

      set({ groupKey });

      // Set up Pusher connection
      const token = useAuthStore.getState().token;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
      const wsHost = process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost';
      const wsPort = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? '8080');
      const wsKey = process.env.EXPO_PUBLIC_REVERB_KEY ?? '';

      pusherInstance = new Pusher(wsKey, {
        wsHost,
        wsPort,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${apiUrl}/api/v1/consumer/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      const channel = pusherInstance.subscribe(
        `presence-night.${nightId}`,
      ) as PresenceChannel;

      channelInstance = channel;

      // Presence events
      channel.bind('pusher:subscription_succeeded', (members: any) => {
        const memberList: PresenceMember[] = [];
        members.each((member: any) => {
          memberList.push({ id: member.id, name: member.info?.name ?? '' });
        });
        set({ presenceMembers: memberList, connectionStatus: 'connected' });
      });

      channel.bind('pusher:member_added', (member: any) => {
        set((state) => ({
          presenceMembers: [
            ...state.presenceMembers,
            { id: member.id, name: member.info?.name ?? '' },
          ],
        }));
      });

      channel.bind('pusher:member_removed', (member: any) => {
        set((state) => ({
          presenceMembers: state.presenceMembers.filter((m) => m.id !== member.id),
        }));
      });

      // Encrypted events from server
      channel.bind('encrypted.event', (data: EncryptedEventPayload) => {
        const currentGroupKey = get().groupKey;
        if (!currentGroupKey) return;

        try {
          const decryptedJson = decryptFromGroup(data.payload, currentGroupKey);
          const decrypted = JSON.parse(decryptedJson);

          switch (data.type) {
            case 'chat.message':
              set((state) => ({
                messages: [
                  ...state.messages,
                  {
                    id: decrypted.id,
                    text: decrypted.text,
                    senderId: data.sender_id,
                    senderName: decrypted.senderName ?? '',
                    timestamp: data.timestamp,
                  },
                ],
              }));
              break;

            case 'location.update':
              set((state) => {
                const newLocations = new Map(state.memberLocations);
                newLocations.set(data.sender_id, {
                  senderId: data.sender_id,
                  latitude: decrypted.latitude,
                  longitude: decrypted.longitude,
                  timestamp: data.timestamp,
                });
                return { memberLocations: newLocations };
              });
              break;
          }
        } catch {
          // Decryption failed — possibly wrong key version, ignore
        }
      });

      // Connection state
      pusherInstance.connection.bind('error', () => {
        set({ connectionStatus: 'error', error: 'WebSocket connection error' });
      });

      pusherInstance.connection.bind('disconnected', () => {
        set({ connectionStatus: 'disconnected' });
      });
    } catch (err: any) {
      set({
        connectionStatus: 'error',
        error: err.message ?? 'Failed to connect to live night',
      });
    }
  },

  disconnect: () => {
    if (channelInstance && pusherInstance) {
      pusherInstance.unsubscribe(channelInstance.name);
    }
    if (pusherInstance) {
      pusherInstance.disconnect();
    }
    pusherInstance = null;
    channelInstance = null;

    set({
      nightId: null,
      connectionStatus: 'disconnected',
      groupKey: null,
      messages: [],
      memberLocations: new Map(),
      presenceMembers: [],
      error: null,
    });
  },

  sendMessage: async (text) => {
    const { nightId, groupKey } = get();
    if (!nightId || !groupKey) return;

    const consumer = useAuthStore.getState().consumer;
    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      senderName: consumer?.name ?? '',
    };

    const encrypted = encryptForGroup(JSON.stringify(messageData), groupKey);

    // Add to local messages immediately (optimistic)
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: messageData.id,
          text,
          senderId: consumer?.id ?? '',
          senderName: messageData.senderName,
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    await api.post(`/consumer/nights/${nightId}/broadcast`, {
      type: 'chat.message',
      payload: encrypted,
    });
  },

  sendLocation: async (latitude, longitude) => {
    const { nightId, groupKey } = get();
    if (!nightId || !groupKey) return;

    const encrypted = encryptForGroup(
      JSON.stringify({ latitude, longitude }),
      groupKey,
    );

    await api.post(`/consumer/nights/${nightId}/broadcast`, {
      type: 'location.update',
      payload: encrypted,
    });
  },

  sendEncryptedEvent: async (type, data) => {
    const { nightId, groupKey } = get();
    if (!nightId || !groupKey) return;

    const encrypted = encryptForGroup(JSON.stringify(data), groupKey);

    await api.post(`/consumer/nights/${nightId}/broadcast`, {
      type,
      payload: encrypted,
    });
  },
}));
