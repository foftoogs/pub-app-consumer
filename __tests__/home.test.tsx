import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../app/(app)/home/index';
import { useAuthStore } from '../features/auth/store';
import { useNightsStore } from '../features/nights/store';

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

const mockConsumer = {
  id: 'c-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-01-01',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureDateStr = futureDate.toISOString().split('T')[0];

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 7);
const pastDateStr = pastDate.toISOString().split('T')[0];

const makeNight = (overrides: Record<string, any> = {}) => ({
  id: 'night-1',
  name: 'Test Night',
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
  ...overrides,
});

beforeEach(() => {
  useAuthStore.setState({ consumer: mockConsumer, token: 'token', isReady: true });
  useNightsStore.setState({ nights: [], currentNight: null, loading: false });
  jest.clearAllMocks();
});

describe('HomeScreen', () => {
  it('displays greeting with consumer first name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Jane')).toBeTruthy();
  });

  it('renders all four dashboard cards', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Events')).toBeTruthy();
    expect(getByText('Venues')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('shows upcoming count on Events card', () => {
    useNightsStore.setState({
      nights: [
        makeNight({ id: 'n1', date: futureDateStr }),
        makeNight({ id: 'n2', date: futureDateStr }),
        makeNight({ id: 'n3', date: pastDateStr }),
      ],
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('2 upcoming')).toBeTruthy();
  });

  it('does not show upcoming count when zero', () => {
    useNightsStore.setState({ nights: [makeNight({ date: pastDateStr })] });
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText(/upcoming/)).toBeNull();
  });

  it('navigates to Events on card press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Events'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/nights');
  });

  it('navigates to Venues on card press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Venues'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/venues');
  });

  it('navigates to Profile on card press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Profile'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/profile');
  });

  it('navigates to Settings on card press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });

  it('shows time-appropriate greeting', () => {
    const { getByText } = render(<HomeScreen />);
    const hour = new Date().getHours();
    if (hour < 12) {
      expect(getByText('Good morning,')).toBeTruthy();
    } else if (hour < 18) {
      expect(getByText('Good afternoon,')).toBeTruthy();
    } else {
      expect(getByText('Good evening,')).toBeTruthy();
    }
  });
});
