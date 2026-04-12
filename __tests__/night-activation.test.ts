import { useNightsStore } from '../features/nights/store';
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
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../lib/crypto', () => ({
  generateKeyPair: jest.fn(() => ({
    publicKey: 'mock-pub',
    secretKey: 'mock-sec',
  })),
  generateGroupKey: jest.fn(() => 'mock-group-key-b64'),
  wrapGroupKey: jest.fn(
    (_groupKey: string, _recipientPub: string, _senderSec: string) => 'wrapped-key-blob',
  ),
  storeSecretKey: jest.fn(() => Promise.resolve()),
  getStoredSecretKey: jest.fn(() => Promise.resolve('mock-secret-key')),
  deleteStoredSecretKey: jest.fn(() => Promise.resolve()),
  getOrCreateDeviceId: jest.fn(() => Promise.resolve('mock-device')),
}));

import api from '../lib/api';
import * as crypto from '../lib/crypto';

const mockApi = api as jest.Mocked<typeof api>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

const mockOrganiser = {
  id: 'consumer-1',
  name: 'Organiser',
  email: 'org@test.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockMember = {
  id: 'consumer-2',
  name: 'Member',
  email: 'member@test.com',
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
  status: 'planning' as const,
  organiser: mockOrganiser,
  members_count: 2,
  itinerary_count: 0,
  current_user_rsvp: 'going' as const,
  members: [
    {
      id: 'nm-1',
      consumer: mockOrganiser,
      role: 'organiser' as const,
      rsvp_status: 'going' as const,
      created_at: '2026-04-05T00:00:00.000Z',
      updated_at: '2026-04-05T00:00:00.000Z',
    },
    {
      id: 'nm-2',
      consumer: mockMember,
      role: 'member' as const,
      rsvp_status: 'going' as const,
      created_at: '2026-04-05T00:00:00.000Z',
      updated_at: '2026-04-05T00:00:00.000Z',
    },
  ],
  itinerary: [],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockCryptoKeyPair = {
  id: 'kp-1',
  consumer_id: 'consumer-1',
  public_key: 'organiser-pub-key',
  device_id: 'mock-device',
  is_active: true,
  revoked_at: null,
  created_at: '2026-04-12T00:00:00.000Z',
  updated_at: '2026-04-12T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [mockNight],
    currentNight: mockNight,
    loading: false,
    error: null,
  });
  useCryptoStore.setState({
    keyPair: mockCryptoKeyPair,
    hasSecretKey: true,
    loading: false,
    error: null,
  });
  jest.clearAllMocks();
  mockCrypto.getStoredSecretKey.mockResolvedValue('mock-secret-key');
});

describe('night activation', () => {
  it('activateNight generates group key, wraps for members, and calls API', async () => {
    // Mock fetchConsumerKeys for each member
    (mockApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('consumer-1/keys')) {
        return Promise.resolve({
          data: { data: [{ id: 'kp-1', public_key: 'org-pub' }] },
        });
      }
      if (url.includes('consumer-2/keys')) {
        return Promise.resolve({
          data: { data: [{ id: 'kp-2', public_key: 'member-pub' }] },
        });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    const activatedNight = { ...mockNight, status: 'active' as const };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: activatedNight });

    const result = await useNightsStore.getState().activateNight('night-1');

    // Should generate a group key
    expect(mockCrypto.generateGroupKey).toHaveBeenCalled();

    // Should wrap for both members
    expect(mockCrypto.wrapGroupKey).toHaveBeenCalledTimes(2);
    expect(mockCrypto.wrapGroupKey).toHaveBeenCalledWith(
      'mock-group-key-b64',
      'org-pub',
      'mock-secret-key',
    );
    expect(mockCrypto.wrapGroupKey).toHaveBeenCalledWith(
      'mock-group-key-b64',
      'member-pub',
      'mock-secret-key',
    );

    // Should call activate endpoint
    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/activate', {
      wrapped_keys: [
        { consumer_id: 'consumer-1', key_pair_id: 'kp-1', wrapped_key: 'wrapped-key-blob' },
        { consumer_id: 'consumer-2', key_pair_id: 'kp-2', wrapped_key: 'wrapped-key-blob' },
      ],
    });

    // Should update store
    expect(result.status).toBe('active');
    expect(useNightsStore.getState().currentNight?.status).toBe('active');
  });

  it('activateNight skips declined members', async () => {
    const nightWithDeclined = {
      ...mockNight,
      members: [
        ...mockNight.members,
        {
          id: 'nm-3',
          consumer: { ...mockMember, id: 'consumer-3', name: 'Declined' },
          role: 'member' as const,
          rsvp_status: 'declined' as const,
          created_at: '2026-04-05T00:00:00.000Z',
          updated_at: '2026-04-05T00:00:00.000Z',
        },
      ],
    };
    useNightsStore.setState({ currentNight: nightWithDeclined });

    (mockApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/consumer/keys') {
        return Promise.resolve({
          data: { data: [mockCryptoKeyPair] },
        });
      }
      if (url.includes('/keys')) {
        return Promise.resolve({
          data: { data: [{ id: 'kp-x', public_key: 'some-pub' }] },
        });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { ...nightWithDeclined, status: 'active' },
    });

    await useNightsStore.getState().activateNight('night-1');

    // Should only wrap for 2 members (going), not the declined one
    expect(mockCrypto.wrapGroupKey).toHaveBeenCalledTimes(2);
  });

  it('activateNight throws when member has no keys', async () => {
    (mockApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('consumer-1/keys')) {
        return Promise.resolve({ data: { data: [{ id: 'kp-1', public_key: 'org-pub' }] } });
      }
      if (url.includes('consumer-2/keys')) {
        return Promise.resolve({ data: { data: [] } }); // No keys!
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    await expect(
      useNightsStore.getState().activateNight('night-1'),
    ).rejects.toThrow('has no encryption keys registered');
  });

  it('activateNight throws when night not loaded', async () => {
    useNightsStore.setState({ currentNight: null });

    await expect(
      useNightsStore.getState().activateNight('night-1'),
    ).rejects.toThrow('Night not loaded');
  });

  it('activateNight throws when no secret key available', async () => {
    mockCrypto.getStoredSecretKey.mockResolvedValueOnce(null);
    useCryptoStore.setState({ keyPair: null, hasSecretKey: false });

    await expect(
      useNightsStore.getState().activateNight('night-1'),
    ).rejects.toThrow('Encryption keys not available');
  });

  it('activateNight includes maybe members in key wrapping', async () => {
    const nightWithMaybe = {
      ...mockNight,
      members: [
        ...mockNight.members,
        {
          id: 'nm-3',
          consumer: { ...mockMember, id: 'consumer-3', name: 'Maybe' },
          role: 'member' as const,
          rsvp_status: 'maybe' as const,
          created_at: '2026-04-05T00:00:00.000Z',
          updated_at: '2026-04-05T00:00:00.000Z',
        },
      ],
    };
    useNightsStore.setState({ currentNight: nightWithMaybe });

    (mockApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/consumer/keys') {
        return Promise.resolve({ data: { data: [mockCryptoKeyPair] } });
      }
      if (url.includes('/keys')) {
        return Promise.resolve({
          data: { data: [{ id: 'kp-x', public_key: 'some-pub' }] },
        });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { ...nightWithMaybe, status: 'active' },
    });

    await useNightsStore.getState().activateNight('night-1');

    // Should wrap for 3 members: organiser (going) + member (going) + maybe
    expect(mockCrypto.wrapGroupKey).toHaveBeenCalledTimes(3);
  });
});

describe('fetchGroupKey', () => {
  it('fetches the wrapped group key for the current user', async () => {
    const mockGroupKey = {
      id: 'gk-1',
      night_id: 'night-1',
      consumer_id: 'consumer-2',
      key_pair_id: 'kp-2',
      wrapped_key: 'wrapped-blob',
      key_version: 1,
      created_at: '2026-04-12T00:00:00.000Z',
      updated_at: '2026-04-12T00:00:00.000Z',
    };

    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockGroupKey });

    const result = await useNightsStore.getState().fetchGroupKey('night-1');

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/nights/night-1/group-key');
    expect(result).toEqual(mockGroupKey);
  });
});
