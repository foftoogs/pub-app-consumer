import { useNightsStore } from '../stores/nights';
import { useVenuesStore } from '../stores/venues';

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

const mockVenue = {
  id: 'venue-1',
  name: 'The Local Pub',
  address: '123 Main St',
  suburb: 'Richmond',
  state: 'VIC',
  postcode: '3121',
  latitude: -37.82,
  longitude: 144.99,
  phone: null,
  email: null,
  description: null,
  is_active: true,
};

const mockVenue2 = {
  ...mockVenue,
  id: 'venue-2',
  name: 'Cocktail Lounge',
  suburb: 'Fitzroy',
};

const mockItineraryItem = {
  id: 'itin-1',
  venue: mockVenue,
  order: 1,
  estimated_arrival: '18:00',
  estimated_departure: '20:00',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockItineraryItem2 = {
  id: 'itin-2',
  venue: mockVenue2,
  order: 2,
  estimated_arrival: '20:30',
  estimated_departure: null,
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockNight = {
  id: 'night-1',
  name: 'Friday Pub Crawl',
  date: '2026-04-10',
  theme: null,
  budget: null,
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
  members_count: 1,
  itinerary_count: 1,
  members: [],
  itinerary: [mockItineraryItem],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [],
    currentNight: null,
    loading: false,
  });
  useVenuesStore.setState({
    venues: [],
    loading: false,
  });
  jest.clearAllMocks();
});

describe('itinerary store actions', () => {
  it('fetchVenues populates venues array', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockVenue, mockVenue2] } });

    await useVenuesStore.getState().fetchVenues();

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/venues', { params: {} });
    expect(useVenuesStore.getState().venues).toEqual([mockVenue, mockVenue2]);
    expect(useVenuesStore.getState().loading).toBe(false);
  });

  it('fetchVenues passes search param', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockVenue] } });

    await useVenuesStore.getState().fetchVenues('local');

    expect(mockApi.get).toHaveBeenCalledWith('/consumer/venues', { params: { search: 'local' } });
  });

  it('addItineraryItem calls API and appends to currentNight', async () => {
    const newItem = { ...mockItineraryItem2 };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { itinerary: newItem } });

    useNightsStore.setState({ currentNight: mockNight });

    const result = await useNightsStore.getState().addItineraryItem('night-1', {
      venue_id: 'venue-2',
      estimated_arrival: '20:30',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/itinerary', {
      venue_id: 'venue-2',
      estimated_arrival: '20:30',
    });
    expect(result).toEqual(newItem);
    expect(useNightsStore.getState().currentNight?.itinerary).toHaveLength(2);
    expect(useNightsStore.getState().currentNight?.itinerary_count).toBe(2);
  });

  it('reorderItinerary calls API and updates itinerary order', async () => {
    const reordered = [
      { ...mockItineraryItem2, order: 1 },
      { ...mockItineraryItem, order: 2 },
    ];
    (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: { itinerary: reordered } });

    useNightsStore.setState({
      currentNight: { ...mockNight, itinerary: [mockItineraryItem, mockItineraryItem2] },
    });

    await useNightsStore.getState().reorderItinerary('night-1', ['itin-2', 'itin-1']);

    expect(mockApi.put).toHaveBeenCalledWith('/consumer/nights/night-1/itinerary', {
      items: ['itin-2', 'itin-1'],
    });
    expect(useNightsStore.getState().currentNight?.itinerary).toEqual(reordered);
  });

  it('removeItineraryItem calls API and removes from currentNight', async () => {
    (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

    useNightsStore.setState({ currentNight: mockNight });

    await useNightsStore.getState().removeItineraryItem('night-1', 'itin-1');

    expect(mockApi.delete).toHaveBeenCalledWith('/consumer/nights/night-1/itinerary/itin-1');
    expect(useNightsStore.getState().currentNight?.itinerary).toHaveLength(0);
    expect(useNightsStore.getState().currentNight?.itinerary_count).toBe(0);
  });

  it('addItineraryItem does not update state for mismatched nightId', async () => {
    const newItem = { ...mockItineraryItem2 };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { itinerary: newItem } });

    useNightsStore.setState({ currentNight: mockNight });

    await useNightsStore.getState().addItineraryItem('night-other', {
      venue_id: 'venue-2',
    });

    expect(useNightsStore.getState().currentNight?.itinerary).toHaveLength(1);
  });
});
