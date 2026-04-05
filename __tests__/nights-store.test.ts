import { useNightsStore } from '../stores/nights';

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

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

const mockNight = {
  id: 'night-1',
  name: 'Friday Pub Crawl',
  date: '2026-04-10',
  theme: 'Cocktail bars',
  budget: 100,
  status: 'planning' as const,
  organiser: {
    id: 'consumer-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    avatar: null,
    email_verified_at: '2026-04-05T00:00:00.000Z',
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
  members_count: 3,
  itinerary_count: 2,
  members: [],
  itinerary: [],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({ nights: [], currentNight: null, loading: false });
  jest.clearAllMocks();
});

describe('nights store', () => {
  it('starts with empty nights', () => {
    const state = useNightsStore.getState();
    expect(state.nights).toEqual([]);
    expect(state.currentNight).toBeNull();
  });

  it('fetchNights populates the nights array', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockNight] } });

    await useNightsStore.getState().fetchNights();

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/nights');
    expect(useNightsStore.getState().nights).toEqual([mockNight]);
  });

  it('fetchNight sets currentNight', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { night: mockNight } });

    await useNightsStore.getState().fetchNight('night-1');

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/nights/night-1');
    expect(useNightsStore.getState().currentNight).toEqual(mockNight);
  });

  it('createNight calls API and prepends to nights', async () => {
    const input = { name: 'New Night', date: '2026-04-15' };
    const newNight = { ...mockNight, id: 'night-2', name: 'New Night' };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { night: newNight } });

    useNightsStore.setState({ nights: [mockNight] });
    const result = await useNightsStore.getState().createNight(input);

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights', input);
    expect(result).toEqual(newNight);
    expect(useNightsStore.getState().nights[0]).toEqual(newNight);
    expect(useNightsStore.getState().nights).toHaveLength(2);
  });

  it('updateNight calls API and updates in list and currentNight', async () => {
    const updated = { ...mockNight, name: 'Updated Name' };
    (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: { night: updated } });

    useNightsStore.setState({ nights: [mockNight], currentNight: mockNight });
    const result = await useNightsStore.getState().updateNight('night-1', { name: 'Updated Name' });

    expect(mockApi.put).toHaveBeenCalledWith('/consumer/nights/night-1', { name: 'Updated Name' });
    expect(result).toEqual(updated);
    expect(useNightsStore.getState().nights[0].name).toBe('Updated Name');
    expect(useNightsStore.getState().currentNight?.name).toBe('Updated Name');
  });

  it('deleteNight calls API and removes from list', async () => {
    (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

    useNightsStore.setState({ nights: [mockNight], currentNight: mockNight });
    await useNightsStore.getState().deleteNight('night-1');

    expect(mockApi.delete).toHaveBeenCalledWith('/consumer/nights/night-1');
    expect(useNightsStore.getState().nights).toHaveLength(0);
    expect(useNightsStore.getState().currentNight).toBeNull();
  });

  it('clearCurrentNight resets currentNight', () => {
    useNightsStore.setState({ currentNight: mockNight });
    useNightsStore.getState().clearCurrentNight();
    expect(useNightsStore.getState().currentNight).toBeNull();
  });
});
