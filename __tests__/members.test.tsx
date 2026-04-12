import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MembersScreen from '../app/(app)/nights/[id]/members';
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

const mockMembers = [
  {
    id: 'member-1',
    consumer: organiser,
    role: 'organiser' as const,
    rsvp_status: 'going' as const,
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'member-2',
    consumer: memberConsumer,
    role: 'member' as const,
    rsvp_status: 'maybe' as const,
    created_at: '2026-04-05T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
];

const mockNight = {
  id: 'night-1',
  name: 'Test Night',
  date: '2026-04-10',
  theme: null,
  budget: null,
  status: 'planning' as const,
  organiser,
  members_count: 2,
  itinerary_count: 0,
  members: mockMembers,
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

describe('MembersScreen', () => {
  it('renders member list with names and emails', () => {
    const { getByText } = render(<MembersScreen />);
    expect(getByText('Organiser User')).toBeTruthy();
    expect(getByText('organiser@example.com')).toBeTruthy();
    expect(getByText('Regular Member')).toBeTruthy();
    expect(getByText('member@example.com')).toBeTruthy();
  });

  it('shows organiser badge on organiser member', () => {
    const { getAllByText } = render(<MembersScreen />);
    expect(getAllByText('Organiser').length).toBeGreaterThanOrEqual(1);
  });

  it('shows initials avatar', () => {
    const { getByText } = render(<MembersScreen />);
    expect(getByText('OU')).toBeTruthy(); // Organiser User
    expect(getByText('RM')).toBeTruthy(); // Regular Member
  });

  it('shows RSVP selectors for organiser', () => {
    const { getAllByText } = render(<MembersScreen />);
    // Each member gets 3 RSVP options
    expect(getAllByText('going').length).toBe(2);
    expect(getAllByText('maybe').length).toBe(2);
    expect(getAllByText('declined').length).toBe(2);
  });

  it('shows RSVP chips (not selectors) for regular member', () => {
    useAuthStore.setState({ consumer: memberConsumer });
    const { getAllByText, queryAllByText } = render(<MembersScreen />);
    // Should show status as chips, not all 3 options per row
    expect(getAllByText('going').length).toBe(1);
    expect(getAllByText('maybe').length).toBe(1);
    expect(queryAllByText('declined').length).toBe(0);
  });

  it('shows add member button for organiser', () => {
    const { getByText } = render(<MembersScreen />);
    expect(getByText('+ Add Member')).toBeTruthy();
  });

  it('hides add member button for regular member', () => {
    useAuthStore.setState({ consumer: memberConsumer });
    const { queryByText } = render(<MembersScreen />);
    expect(queryByText('+ Add Member')).toBeNull();
  });

  it('shows add input when add button pressed', () => {
    (mockApi.get as jest.Mock).mockResolvedValue({ data: { consumers: [] } });
    const { getByText, getByPlaceholderText } = render(<MembersScreen />);
    fireEvent.press(getByText('+ Add Member'));
    expect(getByPlaceholderText('Email or mobile number')).toBeTruthy();
    expect(getByText('Add')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls addMemberByIdentifier API on submit', async () => {
    (mockApi.get as jest.Mock).mockResolvedValue({ data: { consumers: [] } });
    const newMember = {
      id: 'member-3',
      consumer: { ...memberConsumer, id: 'consumer-3', name: 'New Person' },
      role: 'member',
      rsvp_status: 'going',
      created_at: '',
      updated_at: '',
    };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: newMember });

    const { getByText, getByPlaceholderText } = render(<MembersScreen />);
    fireEvent.press(getByText('+ Add Member'));
    fireEvent.changeText(getByPlaceholderText('Email or mobile number'), 'friend@example.com');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights/night-1/members', {
        identifier: 'friend@example.com',
      });
    });
  });

  it('shows success message when invite is sent for unknown user', async () => {
    (mockApi.get as jest.Mock).mockResolvedValue({ data: { consumers: [] } });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { invited: true, message: 'Consumer not found. An invite has been sent.', invite_code: 'abc123' },
    });

    const { getByText, getByPlaceholderText, findByText } = render(<MembersScreen />);
    fireEvent.press(getByText('+ Add Member'));
    fireEvent.changeText(getByPlaceholderText('Email or mobile number'), 'stranger@example.com');
    fireEvent.press(getByText('Add'));

    expect(await findByText('Consumer not found. An invite has been sent.')).toBeTruthy();
  });

  it('shows error on failed add', async () => {
    (mockApi.get as jest.Mock).mockResolvedValue({ data: { consumers: [] } });
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Invalid identifier' } },
    });

    const { getByText, getByPlaceholderText, findByText } = render(<MembersScreen />);
    fireEvent.press(getByText('+ Add Member'));
    fireEvent.changeText(getByPlaceholderText('Email or mobile number'), 'bad');
    fireEvent.press(getByText('Add'));

    expect(await findByText('Invalid identifier')).toBeTruthy();
  });

  it('shows remove button only for non-organiser members (organiser view)', () => {
    const { queryByTestId } = render(<MembersScreen />);
    // Only non-organiser member (member-2) has a remove button
    expect(queryByTestId('remove-member-member-2')).toBeTruthy();
    expect(queryByTestId('remove-member-member-1')).toBeNull();
  });

  it('shows confirmation on remove press', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = render(<MembersScreen />);
    fireEvent.press(getByTestId('remove-member-member-2'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Remove Member',
      'Remove Regular Member from this night?',
      expect.any(Array),
    );
  });

  it('calls updateMemberRsvp on RSVP option press', async () => {
    const updatedMember = { ...mockMembers[1], rsvp_status: 'going' };
    (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: { member: updatedMember } });

    const { getAllByText } = render(<MembersScreen />);
    // Press 'going' for the second member (first 'going' is for organiser row)
    const goingButtons = getAllByText('going');
    fireEvent.press(goingButtons[1]);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/consumer/members/member-2', {
        rsvp_status: 'going',
      });
    });
  });

  it('returns null when no current night', () => {
    useNightsStore.setState({ currentNight: null });
    const { toJSON } = render(<MembersScreen />);
    expect(toJSON()).toBeNull();
  });
});
