import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ItineraryScreen from '../app/(app)/nights/[id]/itinerary';
import { useNightsStore } from '../stores/nights';
import { useAuthStore } from '../stores/auth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'night-1' }),
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

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
}));

jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = require('react-native');
  const MockDraggableFlatList = (props: any) => (
    <FlatList
      {...props}
      renderItem={({ item, index }: any) =>
        props.renderItem({ item, drag: jest.fn(), isActive: false, getIndex: () => index })
      }
    />
  );
  MockDraggableFlatList.displayName = 'MockDraggableFlatList';
  return {
    __esModule: true,
    default: MockDraggableFlatList,
    ScaleDecorator: ({ children }: any) => children,
  };
});

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

const organiser = {
  id: 'consumer-1',
  name: 'Organiser User',
  email: 'organiser@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const memberConsumer = {
  ...organiser,
  id: 'consumer-2',
  name: 'Regular Member',
  email: 'member@example.com',
};

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
  estimated_arrival: null,
  estimated_departure: null,
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockNight = {
  id: 'night-1',
  name: 'Test Night',
  date: '2026-04-10',
  theme: null,
  budget: null,
  status: 'planning' as const,
  organiser,
  members_count: 1,
  itinerary_count: 2,
  members: [],
  itinerary: [mockItineraryItem, mockItineraryItem2],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [mockNight],
    currentNight: mockNight,
    loading: false,
    venues: [mockVenue, mockVenue2],
    venuesLoading: false,
  });
  useAuthStore.setState({ consumer: organiser, token: 'token', isReady: true });
  jest.clearAllMocks();
});

describe('ItineraryScreen', () => {
  it('renders itinerary items with venue names and stop numbers', () => {
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('The Local Pub')).toBeTruthy();
    expect(getByText('Cocktail Lounge')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('shows suburb on venue cards', () => {
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('Richmond')).toBeTruthy();
    expect(getByText('Fitzroy')).toBeTruthy();
  });

  it('shows arrival and departure times', () => {
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('Arrive: 18:00')).toBeTruthy();
    expect(getByText('Depart: 20:00')).toBeTruthy();
  });

  it('shows "No times set" when no times provided', () => {
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('No times set')).toBeTruthy();
  });

  it('shows empty state when no itinerary items', () => {
    useNightsStore.setState({
      currentNight: { ...mockNight, itinerary: [], itinerary_count: 0 },
    });
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('No venues added yet')).toBeTruthy();
  });

  it('shows add venue button for organiser in planning status', () => {
    const { getByText } = render(<ItineraryScreen />);
    expect(getByText('+ Add Venue')).toBeTruthy();
  });

  it('hides add venue button for non-organiser', () => {
    useAuthStore.setState({ consumer: memberConsumer });
    const { queryByText } = render(<ItineraryScreen />);
    expect(queryByText('+ Add Venue')).toBeNull();
  });

  it('hides add venue button when night is not planning', () => {
    useNightsStore.setState({
      currentNight: { ...mockNight, status: 'active' },
    });
    const { queryByText } = render(<ItineraryScreen />);
    expect(queryByText('+ Add Venue')).toBeNull();
  });

  it('shows remove buttons for organiser in planning', () => {
    const { getAllByText } = render(<ItineraryScreen />);
    expect(getAllByText('x')).toHaveLength(2);
  });

  it('hides remove buttons for non-organiser', () => {
    useAuthStore.setState({ consumer: memberConsumer });
    const { queryAllByText } = render(<ItineraryScreen />);
    expect(queryAllByText('x')).toHaveLength(0);
  });

  it('shows confirmation dialog on remove press', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getAllByText } = render(<ItineraryScreen />);
    fireEvent.press(getAllByText('x')[0]);
    expect(alertSpy).toHaveBeenCalledWith(
      'Remove Venue',
      'Remove The Local Pub from the itinerary?',
      expect.any(Array),
    );
  });

  it('opens venue picker modal on add button press', () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockVenue, mockVenue2] } });
    const { getByText, getByPlaceholderText } = render(<ItineraryScreen />);
    fireEvent.press(getByText('+ Add Venue'));
    expect(getByPlaceholderText('Search venues...')).toBeTruthy();
    expect(getByText('Add Venue')).toBeTruthy();
  });

  it('calls addItineraryItem when venue selected and add pressed', async () => {
    const newItem = {
      id: 'itin-3',
      venue: { ...mockVenue, id: 'venue-3', name: 'New Bar' },
      order: 3,
      estimated_arrival: null,
      estimated_departure: null,
      created_at: '',
      updated_at: '',
    };

    // First call for fetchVenues on modal open
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: [{ ...mockVenue, id: 'venue-3', name: 'New Bar', suburb: 'CBD' }] },
    });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { itinerary: newItem } });

    // Set venues to include an unselected venue
    useNightsStore.setState({
      ...useNightsStore.getState(),
      venues: [{ ...mockVenue, id: 'venue-3', name: 'New Bar', suburb: 'CBD' }],
    });

    const { getByText } = render(<ItineraryScreen />);
    fireEvent.press(getByText('+ Add Venue'));

    await waitFor(() => {
      expect(getByText('New Bar')).toBeTruthy();
    });

    fireEvent.press(getByText('New Bar'));
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/itinerary', {
        venue_id: 'venue-3',
        estimated_arrival: undefined,
        estimated_departure: undefined,
      });
    });
  });

  it('returns null when no current night', () => {
    useNightsStore.setState({ currentNight: null });
    const { toJSON } = render(<ItineraryScreen />);
    expect(toJSON()).toBeNull();
  });
});
