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
    delete: jest.fn(),
  },
}));

jest.mock('../lib/crypto', () => ({
  generateKeyPair: jest.fn(() => ({
    publicKey: 'mock-public-key-base64',
    secretKey: 'mock-secret-key-base64',
  })),
  storeSecretKey: jest.fn(() => Promise.resolve()),
  getStoredSecretKey: jest.fn(() => Promise.resolve(null)),
  deleteStoredSecretKey: jest.fn(() => Promise.resolve()),
  getOrCreateDeviceId: jest.fn(() => Promise.resolve('mock-device-id')),
}));

import api from '../lib/api';
import * as crypto from '../lib/crypto';

const mockApi = api as jest.Mocked<typeof api>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

const mockKeyPairResponse = {
  id: 'kp-1',
  consumer_id: 'consumer-1',
  public_key: 'mock-public-key-base64',
  device_id: 'mock-device-id',
  is_active: true,
  revoked_at: null,
  created_at: '2026-04-12T00:00:00.000Z',
  updated_at: '2026-04-12T00:00:00.000Z',
};

beforeEach(() => {
  useCryptoStore.setState({
    keyPair: null,
    hasSecretKey: false,
    loading: false,
    error: null,
  });
  jest.clearAllMocks();
});

describe('crypto store', () => {
  it('ensureKeyPair generates and registers a new key pair', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { data: mockKeyPairResponse },
    });

    await useCryptoStore.getState().ensureKeyPair();

    expect(mockCrypto.generateKeyPair).toHaveBeenCalled();
    expect(mockCrypto.storeSecretKey).toHaveBeenCalledWith('mock-secret-key-base64');
    expect(mockApi.post).toHaveBeenCalledWith('/consumer/keys', {
      public_key: 'mock-public-key-base64',
      device_id: 'mock-device-id',
    });
    expect(useCryptoStore.getState().keyPair).toEqual(mockKeyPairResponse);
    expect(useCryptoStore.getState().hasSecretKey).toBe(true);
    expect(useCryptoStore.getState().loading).toBe(false);
  });

  it('ensureKeyPair reuses existing key if secret and server match', async () => {
    mockCrypto.getStoredSecretKey.mockResolvedValueOnce('existing-secret');
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [mockKeyPairResponse] },
    });

    await useCryptoStore.getState().ensureKeyPair();

    expect(mockCrypto.generateKeyPair).not.toHaveBeenCalled();
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(useCryptoStore.getState().keyPair).toEqual(mockKeyPairResponse);
    expect(useCryptoStore.getState().hasSecretKey).toBe(true);
  });

  it('ensureKeyPair re-registers if secret exists but server has no matching device', async () => {
    mockCrypto.getStoredSecretKey.mockResolvedValueOnce('existing-secret');
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ ...mockKeyPairResponse, device_id: 'other-device' }] },
    });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { data: mockKeyPairResponse },
    });

    await useCryptoStore.getState().ensureKeyPair();

    expect(mockCrypto.generateKeyPair).toHaveBeenCalled();
    expect(mockApi.post).toHaveBeenCalled();
  });

  it('ensureKeyPair sets error on failure', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Server error' } },
    });

    await useCryptoStore.getState().ensureKeyPair();

    expect(useCryptoStore.getState().error).toBe('Server error');
    expect(useCryptoStore.getState().loading).toBe(false);
  });

  it('fetchConsumerKeys returns other consumer keys', async () => {
    const otherKeys = [{ ...mockKeyPairResponse, consumer_id: 'consumer-2' }];
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: otherKeys },
    });

    const keys = await useCryptoStore.getState().fetchConsumerKeys('consumer-2');

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/consumers/consumer-2/keys');
    expect(keys).toEqual(otherKeys);
  });

  it('revokeKeyPair calls API and clears local state', async () => {
    useCryptoStore.setState({ keyPair: mockKeyPairResponse, hasSecretKey: true });
    (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

    await useCryptoStore.getState().revokeKeyPair();

    expect(mockApi.delete).toHaveBeenCalledWith('/consumer/keys/kp-1');
    expect(mockCrypto.deleteStoredSecretKey).toHaveBeenCalled();
    expect(useCryptoStore.getState().keyPair).toBeNull();
    expect(useCryptoStore.getState().hasSecretKey).toBe(false);
  });

  it('revokeKeyPair succeeds even without existing key pair', async () => {
    await useCryptoStore.getState().revokeKeyPair();

    expect(mockApi.delete).not.toHaveBeenCalled();
    expect(mockCrypto.deleteStoredSecretKey).toHaveBeenCalled();
  });

  it('clearLocal removes local state without API call', async () => {
    useCryptoStore.setState({ keyPair: mockKeyPairResponse, hasSecretKey: true });

    await useCryptoStore.getState().clearLocal();

    expect(mockApi.delete).not.toHaveBeenCalled();
    expect(mockCrypto.deleteStoredSecretKey).toHaveBeenCalled();
    expect(useCryptoStore.getState().keyPair).toBeNull();
  });
});
