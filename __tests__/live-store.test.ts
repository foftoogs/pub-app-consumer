import { useLiveStore } from '../features/live/store';
import { useNightsStore } from '../features/nights/store';
import { useAuthStore } from '../features/auth/store';
import { useCryptoStore } from '../features/crypto/store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock pusher-js — capture bind handlers so we can trigger them in tests
const channelHandlers: Record<string, (...args: any[]) => void> = {};
const connectionHandlers: Record<string, (...args: any[]) => void> = {};

const mockBind = jest.fn((event: string, handler: (...args: any[]) => void) => {
  channelHandlers[event] = handler;
});
const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn(() => ({
  name: 'presence-night.night-1',
  bind: mockBind,
}));
const mockDisconnect = jest.fn();
const mockConnectionBind = jest.fn((event: string, handler: (...args: any[]) => void) => {
  connectionHandlers[event] = handler;
});

jest.mock('pusher-js', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    disconnect: mockDisconnect,
    connection: { bind: mockConnectionBind },
  }));
});

jest.mock('../lib/crypto', () => ({
  encryptForGroup: jest.fn((plaintext: string, _key: string) => `encrypted:${plaintext}`),
  decryptFromGroup: jest.fn((ciphertext: string, _key: string) => ciphertext.replace('encrypted:', '')),
  unwrapGroupKey: jest.fn(() => 'decrypted-group-key-b64'),
  getStoredSecretKey: jest.fn(() => Promise.resolve('mock-secret-key')),
  generateKeyPair: jest.fn(() => ({ publicKey: 'pub', secretKey: 'sec' })),
  storeSecretKey: jest.fn(() => Promise.resolve()),
  deleteStoredSecretKey: jest.fn(() => Promise.resolve()),
  getOrCreateDeviceId: jest.fn(() => Promise.resolve('device-1')),
}));

import api from '../lib/api';
import * as crypto from '../lib/crypto';

const mockApi = api as jest.Mocked<typeof api>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

const mockConsumer = {
  id: 'consumer-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockNight = {
  id: 'night-1',
  name: 'Friday Night',
  date: '2026-04-18',
  theme: null,
  budget: null,
  status: 'active' as const,
  organiser: { ...mockConsumer, id: 'organiser-1', name: 'Organiser' },
  members_count: 2,
  itinerary_count: 0,
  current_user_rsvp: 'going' as const,
  members: [],
  itinerary: [],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useLiveStore.setState({
    nightId: null,
    connectionStatus: 'disconnected',
    groupKey: null,
    messages: [],
    memberLocations: new Map(),
    presenceMembers: [],
    error: null,
  });

  useAuthStore.setState({
    consumer: mockConsumer,
    token: 'mock-token',
    isReady: true,
    error: null,
    pendingInviteCode: null,
  });

  useNightsStore.setState({
    nights: [mockNight],
    currentNight: mockNight,
    loading: false,
    error: null,
  });

  useCryptoStore.setState({
    keyPair: {
      id: 'kp-1',
      consumer_id: 'consumer-1',
      public_key: 'my-pub-key',
      device_id: 'device-1',
      is_active: true,
      revoked_at: null,
      created_at: '2026-04-12T00:00:00.000Z',
      updated_at: '2026-04-12T00:00:00.000Z',
    },
    hasSecretKey: true,
    loading: false,
    error: null,
  });

  jest.clearAllMocks();
  mockCrypto.getStoredSecretKey.mockResolvedValue('mock-secret-key');
});

describe('live store', () => {
  it('connect fetches group key, unwraps it, and subscribes to channel', async () => {
    // Mock fetchGroupKey
    (mockApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('group-key')) {
        return Promise.resolve({
          data: {
            wrapped_key: 'wrapped-blob',
            key_version: 1,
          },
        });
      }
      if (url.includes('organiser-1/keys')) {
        return Promise.resolve({
          data: { data: [{ id: 'kp-org', public_key: 'org-pub-key' }] },
        });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    await useLiveStore.getState().connect('night-1');

    expect(mockCrypto.unwrapGroupKey).toHaveBeenCalledWith(
      'wrapped-blob',
      'org-pub-key',
      'mock-secret-key',
    );

    expect(useLiveStore.getState().nightId).toBe('night-1');
    expect(useLiveStore.getState().groupKey).toBe('decrypted-group-key-b64');
    expect(mockSubscribe).toHaveBeenCalledWith('presence-night.night-1');
  });

  it('connect sets error when group key fetch fails', async () => {
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await useLiveStore.getState().connect('night-1');

    expect(useLiveStore.getState().connectionStatus).toBe('error');
    expect(useLiveStore.getState().error).toBe('Network error');
  });

  it('connect sets error when no secret key available', async () => {
    mockCrypto.getStoredSecretKey.mockResolvedValueOnce(null);
    useCryptoStore.setState({ keyPair: null, hasSecretKey: false });

    // Need to mock the fetchGroupKey API call
    (mockApi.get as jest.Mock).mockResolvedValue({
      data: { wrapped_key: 'blob', key_version: 1 },
    });

    await useLiveStore.getState().connect('night-1');

    expect(useLiveStore.getState().connectionStatus).toBe('error');
    expect(useLiveStore.getState().error).toContain('Encryption keys');
  });

  it('disconnect cleans up state', async () => {
    useLiveStore.setState({
      nightId: 'night-1',
      connectionStatus: 'connected',
      groupKey: 'some-key',
      messages: [{ id: '1', text: 'hi', senderId: 'a', senderName: 'A', timestamp: '' }],
      presenceMembers: [{ id: 'a', name: 'A' }],
    });

    useLiveStore.getState().disconnect();

    expect(useLiveStore.getState().nightId).toBeNull();
    expect(useLiveStore.getState().connectionStatus).toBe('disconnected');
    expect(useLiveStore.getState().groupKey).toBeNull();
    expect(useLiveStore.getState().messages).toEqual([]);
    expect(useLiveStore.getState().presenceMembers).toEqual([]);
  });

  it('sendMessage encrypts and posts to broadcast endpoint', async () => {
    useLiveStore.setState({
      nightId: 'night-1',
      groupKey: 'group-key-b64',
      connectionStatus: 'connected',
    });

    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: 'sent' } });

    await useLiveStore.getState().sendMessage('Hello everyone!');

    expect(mockCrypto.encryptForGroup).toHaveBeenCalled();
    const encryptCall = mockCrypto.encryptForGroup.mock.calls[0];
    const plaintext = JSON.parse(encryptCall[0]);
    expect(plaintext.text).toBe('Hello everyone!');
    expect(plaintext.senderName).toBe('Test User');
    expect(encryptCall[1]).toBe('group-key-b64');

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/broadcast', {
      type: 'chat.message',
      payload: expect.stringContaining('encrypted:'),
    });

    // Optimistic local message
    expect(useLiveStore.getState().messages).toHaveLength(1);
    expect(useLiveStore.getState().messages[0].text).toBe('Hello everyone!');
  });

  it('sendLocation encrypts and posts location update', async () => {
    useLiveStore.setState({
      nightId: 'night-1',
      groupKey: 'group-key-b64',
      connectionStatus: 'connected',
    });

    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: 'sent' } });

    await useLiveStore.getState().sendLocation(-37.8136, 144.9631);

    expect(mockCrypto.encryptForGroup).toHaveBeenCalled();
    const plaintext = JSON.parse(mockCrypto.encryptForGroup.mock.calls[0][0]);
    expect(plaintext.latitude).toBe(-37.8136);
    expect(plaintext.longitude).toBe(144.9631);

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/broadcast', {
      type: 'location.update',
      payload: expect.stringContaining('encrypted:'),
    });
  });

  it('sendMessage does nothing when not connected to a night', async () => {
    useLiveStore.setState({ nightId: null, groupKey: null });

    await useLiveStore.getState().sendMessage('test');

    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('sendEncryptedEvent sends arbitrary encrypted data', async () => {
    useLiveStore.setState({
      nightId: 'night-1',
      groupKey: 'group-key-b64',
      connectionStatus: 'connected',
    });

    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: 'sent' } });

    await useLiveStore.getState().sendEncryptedEvent('chat.typing', { typing: true });

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/broadcast', {
      type: 'chat.typing',
      payload: expect.stringContaining('encrypted:'),
    });
  });

  describe('presence handlers', () => {
    async function connectAndGetHandlers() {
      (mockApi.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('group-key')) {
          return Promise.resolve({ data: { wrapped_key: 'blob', key_version: 1 } });
        }
        if (url.includes('organiser-1/keys')) {
          return Promise.resolve({ data: { data: [{ id: 'kp-org', public_key: 'org-pub' }] } });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });
      await useLiveStore.getState().connect('night-1');
    }

    it('subscription_succeeded populates presence members', async () => {
      await connectAndGetHandlers();

      const members: any[] = [];
      const mockMembers = {
        each: (cb: (m: any) => void) => {
          [{ id: 'consumer-1', info: { name: 'Alice' } }, { id: 'consumer-2', info: { name: 'Bob' } }]
            .forEach(cb);
        },
      };

      channelHandlers['pusher:subscription_succeeded'](mockMembers);

      expect(useLiveStore.getState().presenceMembers).toEqual([
        { id: 'consumer-1', name: 'Alice' },
        { id: 'consumer-2', name: 'Bob' },
      ]);
      expect(useLiveStore.getState().connectionStatus).toBe('connected');
    });

    it('member_added appends to presence list', async () => {
      await connectAndGetHandlers();
      useLiveStore.setState({ presenceMembers: [{ id: 'consumer-1', name: 'Alice' }] });

      channelHandlers['pusher:member_added']({ id: 'consumer-3', info: { name: 'Charlie' } });

      expect(useLiveStore.getState().presenceMembers).toEqual([
        { id: 'consumer-1', name: 'Alice' },
        { id: 'consumer-3', name: 'Charlie' },
      ]);
    });

    it('member_removed removes from presence list', async () => {
      await connectAndGetHandlers();
      useLiveStore.setState({
        presenceMembers: [
          { id: 'consumer-1', name: 'Alice' },
          { id: 'consumer-2', name: 'Bob' },
        ],
      });

      channelHandlers['pusher:member_removed']({ id: 'consumer-2' });

      expect(useLiveStore.getState().presenceMembers).toEqual([
        { id: 'consumer-1', name: 'Alice' },
      ]);
    });
  });

  describe('encrypted event receive handlers', () => {
    async function connectWithGroupKey() {
      (mockApi.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('group-key')) {
          return Promise.resolve({ data: { wrapped_key: 'blob', key_version: 1 } });
        }
        if (url.includes('organiser-1/keys')) {
          return Promise.resolve({ data: { data: [{ id: 'kp-org', public_key: 'org-pub' }] } });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });
      await useLiveStore.getState().connect('night-1');
    }

    it('decrypts and appends incoming chat messages', async () => {
      await connectWithGroupKey();

      const messageJson = JSON.stringify({
        id: 'msg-1',
        text: 'Hey there!',
        senderName: 'Bob',
      });

      channelHandlers['encrypted.event']({
        type: 'chat.message',
        payload: `encrypted:${messageJson}`,
        sender_id: 'consumer-2',
        timestamp: '2026-04-12T20:00:00.000Z',
      });

      expect(mockCrypto.decryptFromGroup).toHaveBeenCalledWith(
        `encrypted:${messageJson}`,
        'decrypted-group-key-b64',
      );

      const messages = useLiveStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        id: 'msg-1',
        text: 'Hey there!',
        senderId: 'consumer-2',
        senderName: 'Bob',
        timestamp: '2026-04-12T20:00:00.000Z',
      });
    });

    it('decrypts and stores incoming location updates', async () => {
      await connectWithGroupKey();

      const locationJson = JSON.stringify({
        latitude: -37.81,
        longitude: 144.96,
      });

      channelHandlers['encrypted.event']({
        type: 'location.update',
        payload: `encrypted:${locationJson}`,
        sender_id: 'consumer-2',
        timestamp: '2026-04-12T20:01:00.000Z',
      });

      const locations = useLiveStore.getState().memberLocations;
      expect(locations.get('consumer-2')).toEqual({
        senderId: 'consumer-2',
        latitude: -37.81,
        longitude: 144.96,
        timestamp: '2026-04-12T20:01:00.000Z',
      });
    });

    it('silently ignores events that fail to decrypt', async () => {
      await connectWithGroupKey();
      mockCrypto.decryptFromGroup.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      channelHandlers['encrypted.event']({
        type: 'chat.message',
        payload: 'corrupted-blob',
        sender_id: 'consumer-2',
        timestamp: '2026-04-12T20:00:00.000Z',
      });

      expect(useLiveStore.getState().messages).toHaveLength(0);
    });

    it('ignores events when no group key is set', async () => {
      await connectWithGroupKey();
      useLiveStore.setState({ groupKey: null });

      channelHandlers['encrypted.event']({
        type: 'chat.message',
        payload: 'some-blob',
        sender_id: 'consumer-2',
        timestamp: '2026-04-12T20:00:00.000Z',
      });

      expect(mockCrypto.decryptFromGroup).not.toHaveBeenCalled();
      expect(useLiveStore.getState().messages).toHaveLength(0);
    });
  });

  describe('connection state handlers', () => {
    async function connectAndBind() {
      (mockApi.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('group-key')) {
          return Promise.resolve({ data: { wrapped_key: 'blob', key_version: 1 } });
        }
        if (url.includes('organiser-1/keys')) {
          return Promise.resolve({ data: { data: [{ id: 'kp-org', public_key: 'org-pub' }] } });
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });
      await useLiveStore.getState().connect('night-1');
    }

    it('sets error status on connection error', async () => {
      await connectAndBind();

      connectionHandlers['error']?.();

      expect(useLiveStore.getState().connectionStatus).toBe('error');
      expect(useLiveStore.getState().error).toBe('WebSocket connection error');
    });

    it('sets disconnected status on disconnect', async () => {
      await connectAndBind();
      useLiveStore.setState({ connectionStatus: 'connected' });

      connectionHandlers['disconnected']?.();

      expect(useLiveStore.getState().connectionStatus).toBe('disconnected');
    });
  });
});
