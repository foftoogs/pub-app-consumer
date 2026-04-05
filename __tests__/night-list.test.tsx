import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NightListScreen from '../app/(app)/nights/index';
import { useNightsStore } from '../stores/nights';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: any[]) => mockPush(...args) },
}));

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { data: [] } })),
    post: jest.fn(),
  },
}));

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureDateStr = futureDate.toISOString().split('T')[0];

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 7);
const pastDateStr = pastDate.toISOString().split('T')[0];

const mockConsumer = {
  id: 'c-1',
  name: 'Test',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const upcomingNight = {
  id: 'night-1',
  name: 'Upcoming Night',
  date: futureDateStr,
  theme: null,
  budget: null,
  status: 'planning' as const,
  organiser: mockConsumer,
  members_count: 2,
  itinerary_count: 0,
  members: [],
  itinerary: [],
  invites: [],
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const pastNight = {
  ...upcomingNight,
  id: 'night-2',
  name: 'Past Night',
  date: pastDateStr,
  status: 'closed' as const,
};

beforeEach(() => {
  useNightsStore.setState({ nights: [], currentNight: null, loading: false });
  jest.clearAllMocks();
});

describe('NightListScreen', () => {
  it('shows empty state when no nights', () => {
    const { getByText } = render(<NightListScreen />);
    expect(getByText('No upcoming nights')).toBeTruthy();
    expect(getByText('Create one to get started!')).toBeTruthy();
  });

  it('renders upcoming nights', () => {
    useNightsStore.setState({ nights: [upcomingNight] });
    const { getByText } = render(<NightListScreen />);
    expect(getByText('Upcoming Night')).toBeTruthy();
    expect(getByText('2 members')).toBeTruthy();
  });

  it('switches to past tab and shows past nights', () => {
    useNightsStore.setState({ nights: [upcomingNight, pastNight] });
    const { getByText, queryByText } = render(<NightListScreen />);

    fireEvent.press(getByText('Past'));
    expect(getByText('Past Night')).toBeTruthy();
    expect(queryByText('Upcoming Night')).toBeNull();
  });

  it('navigates to create on FAB press', () => {
    const { getByText } = render(<NightListScreen />);
    fireEvent.press(getByText('+'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/nights/create');
  });

  it('navigates to night detail on card press', () => {
    useNightsStore.setState({ nights: [upcomingNight] });
    const { getByText } = render(<NightListScreen />);
    fireEvent.press(getByText('Upcoming Night'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/nights/night-1');
  });
});
