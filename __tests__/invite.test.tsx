import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InviteScreen from '../app/(app)/nights/[id]/invite';
import { useNightsStore } from '../features/nights/store';
import { useAuthStore } from '../features/auth/store';

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

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

import api from '../lib/api';
import * as Clipboard from 'expo-clipboard';

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

const mockUsedInvite = {
  ...mockInvite,
  id: 'invite-2',
  invite_code: 'DEF456',
  status: 'used' as const,
  accepted_by: memberConsumer,
  accepted_at: '2026-04-06T00:00:00.000Z',
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
  itinerary_count: 0,
  members: [],
  itinerary: [],
  invites: [mockInvite, mockUsedInvite],
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useNightsStore.setState({
    nights: [mockNight],
    currentNight: mockNight,
    loading: false,
    venues: [],
    venuesLoading: false,
  });
  useAuthStore.setState({ consumer: organiser, token: 'token', isReady: true, pendingInviteCode: null });
  jest.clearAllMocks();
});

describe('InviteScreen', () => {
  it('renders invite list with statuses', () => {
    const { getByText } = render(<InviteScreen />);
    expect(getByText('pending')).toBeTruthy();
    expect(getByText('used')).toBeTruthy();
  });

  it('shows invite links', () => {
    const { getByText } = render(<InviteScreen />);
    expect(getByText('nightout://invite/ABC123')).toBeTruthy();
    expect(getByText('nightout://invite/DEF456')).toBeTruthy();
  });

  it('shows accepted by name for used invites', () => {
    const { getByText } = render(<InviteScreen />);
    expect(getByText('Accepted by Regular Member')).toBeTruthy();
  });

  it('shows copy button only for pending invites', () => {
    const { getAllByText } = render(<InviteScreen />);
    expect(getAllByText('Copy Link')).toHaveLength(1);
  });

  it('copies link to clipboard on press', async () => {
    const { getByText } = render(<InviteScreen />);
    fireEvent.press(getByText('Copy Link'));
    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('nightout://invite/ABC123');
    });
  });

  it('shows generate button for organiser', () => {
    const { getByText } = render(<InviteScreen />);
    expect(getByText('Generate Invite Link')).toBeTruthy();
  });

  it('calls generateInvite on generate press', async () => {
    const newInvite = { ...mockInvite, id: 'invite-3', invite_code: 'GHI789' };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { invite: newInvite } });

    const { getByText } = render(<InviteScreen />);
    fireEvent.press(getByText('Generate Invite Link'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/invites');
    });
  });

  it('shows error on failed generate', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Limit reached' } },
    });

    const { getByText, findByText } = render(<InviteScreen />);
    fireEvent.press(getByText('Generate Invite Link'));

    expect(await findByText('Limit reached')).toBeTruthy();
  });

  it('shows non-organiser message for regular members', () => {
    useAuthStore.setState({ consumer: memberConsumer });
    const { getByText, queryByText } = render(<InviteScreen />);
    expect(getByText('Only the organiser can manage invites')).toBeTruthy();
    expect(queryByText('Generate Invite Link')).toBeNull();
  });

  it('returns null when no current night', () => {
    useNightsStore.setState({ currentNight: null });
    const { toJSON } = render(<InviteScreen />);
    expect(toJSON()).toBeNull();
  });
});
