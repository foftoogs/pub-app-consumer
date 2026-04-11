import React from 'react';
import { render } from '@testing-library/react-native';
import LiveScreen from '../app/(app)/live/index';
import { useNightsStore } from '../stores/nights';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
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

const mockConsumer = {
  id: 'c-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockVenue1 = {
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
  ...mockVenue1,
  id: 'venue-2',
  name: 'Cocktail Lounge',
  suburb: 'Fitzroy',
};

const mockVenue3 = {
  ...mockVenue1,
  id: 'venue-3',
  name: 'Late Night Bar',
  suburb: 'Collingwood',
};

const mockItinerary = [
  {
    id: 'itin-1',
    venue: mockVenue1,
    order: 1,
    estimated_arrival: '18:00',
    estimated_departure: '20:00',
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'itin-2',
    venue: mockVenue2,
    order: 2,
    estimated_arrival: '20:30',
    estimated_departure: '22:00',
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'itin-3',
    venue: mockVenue3,
    order: 3,
    estimated_arrival: null,
    estimated_departure: null,
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
];

const activeNight = {
  id: 'night-1',
  name: 'Friday Night Out',
  date: '2026-04-10',
  theme: null,
  budget: null,
  status: 'active' as const,
  organiser: mockConsumer,
  members_count: 3,
  itinerary_count: 3,
  members: [],
  itinerary: mockItinerary,
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-10T18:00:00.000Z',
};

const planningNight = {
  ...activeNight,
  id: 'night-2',
  name: 'Planning Night',
  status: 'planning' as const,
  updated_at: '2026-04-08T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [],
    currentNight: null,
    loading: false,
  });
  jest.clearAllMocks();
});

describe('LiveScreen', () => {
  it('shows empty state when no active nights', () => {
    useNightsStore.setState({ nights: [planningNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('No active night')).toBeTruthy();
    expect(getByText('View Events')).toBeTruthy();
  });

  it('shows active night name and date', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('Friday Night Out')).toBeTruthy();
    expect(getByText('2026-04-10')).toBeTruthy();
  });

  it('shows LIVE label in header', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('LIVE')).toBeTruthy();
  });

  it('renders all itinerary stops', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('The Local Pub')).toBeTruthy();
    expect(getByText('Cocktail Lounge')).toBeTruthy();
    expect(getByText('Late Night Bar')).toBeTruthy();
  });

  it('shows stop numbers', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('Stop 1')).toBeTruthy();
    expect(getByText('Stop 2')).toBeTruthy();
    expect(getByText('Stop 3')).toBeTruthy();
  });

  it('shows suburb for venues', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('Richmond')).toBeTruthy();
    expect(getByText('Fitzroy')).toBeTruthy();
    expect(getByText('Collingwood')).toBeTruthy();
  });

  it('shows time range for stops with times', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('18:00 — 20:00')).toBeTruthy();
    expect(getByText('20:30 — 22:00')).toBeTruthy();
  });

  it('highlights the "Now" badge on current stop', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    // The "Now" badge should exist on exactly one stop
    expect(getByText('Now')).toBeTruthy();
  });

  it('renders stop testIDs', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByTestId } = render(<LiveScreen />);
    expect(getByTestId('live-stop-0')).toBeTruthy();
    expect(getByTestId('live-stop-1')).toBeTruthy();
    expect(getByTestId('live-stop-2')).toBeTruthy();
  });

  it('shows future feature placeholders', () => {
    useNightsStore.setState({ nights: [activeNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('Coming Soon')).toBeTruthy();
    expect(getByText('Check-in')).toBeTruthy();
    expect(getByText('Group Chat')).toBeTruthy();
    expect(getByText('Split Bill')).toBeTruthy();
    expect(getByText('Photos')).toBeTruthy();
  });

  it('shows most recently updated active night when multiple exist', () => {
    const olderActive = {
      ...activeNight,
      id: 'night-old',
      name: 'Older Active Night',
      updated_at: '2026-04-09T12:00:00.000Z',
    };
    useNightsStore.setState({ nights: [olderActive, activeNight] });
    const { getByText, queryByText } = render(<LiveScreen />);
    expect(getByText('Friday Night Out')).toBeTruthy();
    expect(queryByText('Older Active Night')).toBeNull();
  });

  it('shows no-stops message when active night has empty itinerary', () => {
    const emptyNight = { ...activeNight, itinerary: [], itinerary_count: 0 };
    useNightsStore.setState({ nights: [emptyNight] });
    const { getByText } = render(<LiveScreen />);
    expect(getByText('No venues in the itinerary yet')).toBeTruthy();
  });
});
