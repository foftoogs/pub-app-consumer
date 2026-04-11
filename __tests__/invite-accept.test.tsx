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

beforeEach(() => {
  useNightsStore.setState({
    nights: [],
    currentNight: null,
    loading: false,
    venues: [],
    venuesLoading: false,
  });
  useAuthStore.setState({ consumer: null, token: null, isReady: true, pendingInviteCode: null });
  jest.clearAllMocks();
});

describe('InviteAcceptScreen', () => {
  it('shows invite message', () => {
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText("You've been invited!")).toBeTruthy();
  });

  it('shows sign in button when unauthenticated', () => {
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText('Sign in to Join')).toBeTruthy();
  });

  it('stores pending invite code and redirects to login when unauthenticated', async () => {
    const { getByText } = render(<InviteAcceptScreen />);
    fireEvent.press(getByText('Sign in to Join'));

    await waitFor(() => {
      expect(useAuthStore.getState().pendingInviteCode).toBe('ABC123');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('shows join button when authenticated', () => {
    useAuthStore.setState({ consumer, token: 'token' });
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText('Join this Night')).toBeTruthy();
  });

  it('calls accept API and navigates to night on success', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Invite accepted', night_id: 'night-1' },
    });

    const { getByText } = render(<InviteAcceptScreen />);

    await waitFor(() => fireEvent.press(getByText('Join this Night')));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/invites/ABC123/accept');
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/nights/night-1');
    });
  });

  it('shows error on failed accept', async () => {
    useAuthStore.setState({ consumer, token: 'token' });
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Invite expired' } },
    });

    const { getByText, findByText } = render(<InviteAcceptScreen />);
    fireEvent.press(getByText('Join this Night'));

    expect(await findByText('Invite expired')).toBeTruthy();
  });

  it('shows go back button when authenticated', () => {
    useAuthStore.setState({ consumer, token: 'token' });
    const { getByText } = render(<InviteAcceptScreen />);
    expect(getByText('Go back')).toBeTruthy();
  });
});
