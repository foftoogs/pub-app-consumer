import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InviteAcceptScreen from '../app/invite/[code]';
import { useNightsStore } from '../features/nights/store';
import { useAuthStore } from '../features/auth/store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ code: 'ABC123' }),
}));

import { router as mockRouter } from 'expo-router';

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

const consumer = {
  id: 'consumer-1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

const mockNight = {
  id: 'night-1',
  name: 'Friday Drinks',
  date: '2026-04-20',
  theme: null,
  budget: null,
  status: 'planning' as const,
  organiser: { ...consumer, name: 'Alice' },
  members_count: 3,
  itinerary_count: 2,
  current_user_rsvp: null,
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
  });
  useAuthStore.setState({ consumer: null, token: null, isReady: true, pendingInviteCode: null });
  jest.clearAllMocks();
});

describe('InviteAcceptScreen', () => {
  it('shows invite message when unauthenticated', () => {
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText("You've been invited!")).toBeTruthy();
  });

  it('shows sign in button when unauthenticated', () => {
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText('Sign in to Continue')).toBeTruthy();
  });

  it('stores pending invite code and redirects to login when unauthenticated', async () => {
    const { getByText } = render(<InviteAcceptScreen />);
    fireEvent.press(getByText('Sign in to Continue'));

    await waitFor(() => {
      expect(useAuthStore.getState().pendingInviteCode).toBe('ABC123');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('shows night details when authenticated and invite loads', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        invite: { invited_by: { name: 'Alice' } },
        night: mockNight,
      },
    });

    const { findByText } = render(<InviteAcceptScreen />);
    expect(await findByText('Friday Drinks')).toBeTruthy();
  });

  it('shows Join/Maybe/Decline buttons when authenticated', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        invite: { invited_by: { name: 'Alice' } },
        night: mockNight,
      },
    });

    const { findByText } = render(<InviteAcceptScreen />);
    expect(await findByText('Join')).toBeTruthy();
    expect(await findByText('Maybe')).toBeTruthy();
    expect(await findByText('Decline')).toBeTruthy();
  });

  it('accepts invite and navigates on Join', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        invite: { invited_by: { name: 'Alice' } },
        night: mockNight,
      },
    });
    (mockApi.post as jest.Mock)
      .mockResolvedValueOnce({ data: { night_id: 'night-1' } })
      .mockResolvedValueOnce({ data: {} });

    const { findByText } = render(<InviteAcceptScreen />);
    const joinButton = await findByText('Join');
    fireEvent.press(joinButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/invites/ABC123/accept');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/nights/night-1');
    });
  });

  it('shows error when invite details fail to load', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.get as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Invite expired' } },
    });

    const { findByText } = render(<InviteAcceptScreen />);
    expect(await findByText('Invite expired')).toBeTruthy();
  });

  it('shows go back button when authenticated', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        invite: { invited_by: { name: 'Alice' } },
        night: mockNight,
      },
    });

    const { findByText } = render(<InviteAcceptScreen />);
    expect(await findByText('Go back')).toBeTruthy();
  });
});
