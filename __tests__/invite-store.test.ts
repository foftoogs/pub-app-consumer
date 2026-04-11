import { useNightsStore } from '../features/nights/store';

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

const organiser = {
  id: 'consumer-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockInvite = {
  id: 'invite-1',
  invite_code: 'ABC123',
  invited_by: organiser,
  accepted_by: null,
  status: 'pending' as const,
  accepted_at: null,
  expires_at: '2026-04-12T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
};

const mockNight = {
  id: 'night-1',
  name: 'Friday Pub Crawl',
  date: '2026-04-10',
  theme: null,
  budget: null,
  status: 'planning' as const,
  organiser,
  members_count: 1,
  itinerary_count: 0,
  members: [],
  itinerary: [],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [],
    currentNight: null,
    loading: false,
    venues: [],
    venuesLoading: false,
  });
  jest.clearAllMocks();
});

describe('invite store actions', () => {
  it('generateInvite calls API and prepends to currentNight invites', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { invite: mockInvite } });

    useNightsStore.setState({ currentNight: mockNight });

    const result = await useNightsStore.getState().generateInvite('night-1');

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/invites');
    expect(result).toEqual(mockInvite);
    expect(useNightsStore.getState().currentNight?.invites).toHaveLength(1);
    expect(useNightsStore.getState().currentNight?.invites[0].invite_code).toBe('ABC123');
  });

  it('generateInvite does not update state for mismatched nightId', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { invite: mockInvite } });

    useNightsStore.setState({ currentNight: mockNight });

    await useNightsStore.getState().generateInvite('night-other');

    expect(useNightsStore.getState().currentNight?.invites).toHaveLength(0);
  });

  it('acceptInvite calls API and returns night_id', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Invite accepted', night_id: 'night-1' },
    });

    const nightId = await useNightsStore.getState().acceptInvite('ABC123');

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/invites/ABC123/accept');
    expect(nightId).toBe('night-1');
  });
});
