import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NightOverviewScreen from '../app/(app)/nights/[id]/index';
import { useNightsStore } from '../features/nights/store';
import { useAuthStore } from '../features/auth/store';
import { Alert } from 'react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: any[]) => mockReplace(...args) },
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

const organiser = {
  id: 'consumer-1',
  name: 'Organiser',
  email: 'organiser@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const member = {
  ...organiser,
  id: 'consumer-2',
  name: 'Member',
  email: 'member@example.com',
};

const mockNight = {
  id: 'night-1',
  name: 'Friday Pub Crawl',
  date: '2026-04-10',
  theme: 'Cocktail bars',
  budget: 100,
  status: 'planning' as const,
  organiser,
  members_count: 3,
  itinerary_count: 2,
  current_user_rsvp: 'going' as const,
  members: [],
  itinerary: [],
  invites: [],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({ nights: [mockNight], currentNight: mockNight, loading: false });
  useAuthStore.setState({ consumer: organiser, token: 'token', isReady: true });
  jest.clearAllMocks();
});

describe('NightOverviewScreen', () => {
  it('renders night details', () => {
    const { getByText } = render(<NightOverviewScreen />);
    expect(getByText('Cocktail bars')).toBeTruthy();
    expect(getByText('$100 per person')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('shows organiser badge when user is organiser', () => {
    const { getByText } = render(<NightOverviewScreen />);
    expect(getByText('Organiser')).toBeTruthy();
  });

  it('hides organiser badge when user is not organiser', () => {
    useAuthStore.setState({ consumer: member });
    const { queryByText } = render(<NightOverviewScreen />);
    expect(queryByText('Organiser')).toBeNull();
  });

  it('shows delete button for organiser on planning night', () => {
    const { getByText } = render(<NightOverviewScreen />);
    expect(getByText('Delete Night')).toBeTruthy();
  });

  it('hides delete button for non-organiser', () => {
    useAuthStore.setState({ consumer: member });
    const { queryByText } = render(<NightOverviewScreen />);
    expect(queryByText('Delete Night')).toBeNull();
  });

  it('hides delete button when night is not in planning status', () => {
    useNightsStore.setState({ currentNight: { ...mockNight, status: 'active' } });
    const { queryByText } = render(<NightOverviewScreen />);
    expect(queryByText('Delete Night')).toBeNull();
  });

  it('shows confirmation alert on delete press', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<NightOverviewScreen />);
    fireEvent.press(getByText('Delete Night'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Night',
      'Are you sure? This cannot be undone.',
      expect.any(Array),
    );
  });

  it('returns null when no current night', () => {
    useNightsStore.setState({ currentNight: null });
    const { toJSON } = render(<NightOverviewScreen />);
    expect(toJSON()).toBeNull();
  });
});
