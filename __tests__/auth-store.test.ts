import { useAuthStore } from '../features/auth/store';

const mockSecureStore: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

const mockConsumer = {
  id: '019d5c11-961c-72cd-9224-170b12ec2b71',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ consumer: null, token: null, isReady: false });
  Object.keys(mockSecureStore).forEach((key) => delete mockSecureStore[key]);
  jest.clearAllMocks();
});

describe('auth store', () => {
  it('starts with null consumer and token', () => {
    const state = useAuthStore.getState();
    expect(state.consumer).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setAuth stores consumer, token, and persists to secure store', async () => {
    await useAuthStore.getState().setAuth(mockConsumer, 'test-token-123');

    const state = useAuthStore.getState();
    expect(state.consumer).toEqual(mockConsumer);
    expect(state.token).toBe('test-token-123');
    expect(mockSecureStore['consumer_token']).toBe('test-token-123');
  });

  it('clearAuth removes consumer, token, and clears secure store', async () => {
    await useAuthStore.getState().setAuth(mockConsumer, 'test-token-123');
    await useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.consumer).toBeNull();
    expect(state.token).toBeNull();
    expect(mockSecureStore['consumer_token']).toBeUndefined();
  });

  it('hydrate restores session when token exists and API succeeds', async () => {
    mockSecureStore['consumer_token'] = 'stored-token';
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { consumer: mockConsumer } });

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBe('stored-token');
    expect(state.consumer).toEqual(mockConsumer);
    expect(state.isReady).toBe(true);
  });

  it('hydrate clears token when API rejects (expired/invalid)', async () => {
    mockSecureStore['consumer_token'] = 'expired-token';
    (mockApi.get as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.consumer).toBeNull();
    expect(state.isReady).toBe(true);
    expect(mockSecureStore['consumer_token']).toBeUndefined();
  });

  it('hydrate sets isReady when no token exists', async () => {
    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isReady).toBe(true);
  });

  it('logout calls API, clears auth, and removes stored token', async () => {
    await useAuthStore.getState().setAuth(mockConsumer, 'test-token-123');
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Logged out.' } });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(mockApi.post).toHaveBeenCalledWith('/consumer/logout');
    expect(state.consumer).toBeNull();
    expect(state.token).toBeNull();
    expect(mockSecureStore['consumer_token']).toBeUndefined();
  });

  it('logout still clears auth even if API call fails', async () => {
    await useAuthStore.getState().setAuth(mockConsumer, 'test-token-123');
    (mockApi.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.consumer).toBeNull();
    expect(state.token).toBeNull();
  });
});
