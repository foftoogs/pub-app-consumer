import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NightCreateScreen from '../app/(app)/nights/create';
import { useNightsStore } from '../features/nights/store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ onChange }: any) => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      React.useEffect(() => {
        onChange({}, future);
      }, []);
      return null;
    },
  };
});

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useNightsStore.setState({ nights: [], currentNight: null, loading: false });
  jest.clearAllMocks();
});

describe('NightCreateScreen', () => {
  it('renders the first step (name)', () => {
    const { getByText, getByPlaceholderText } = render(<NightCreateScreen />);
    expect(getByText("What's the night called?")).toBeTruthy();
    expect(getByPlaceholderText('e.g. Friday Pub Crawl')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
  });

  it('disables Next when name is empty', () => {
    const { getByText } = render(<NightCreateScreen />);
    const next = getByText('Next');
    expect(next.parent?.parent?.props.disabled || next.parent?.props.accessibilityState?.disabled).toBeTruthy;
  });

  it('advances to date step after entering name', () => {
    const { getByText, getByPlaceholderText } = render(<NightCreateScreen />);
    fireEvent.changeText(getByPlaceholderText('e.g. Friday Pub Crawl'), 'Test Night');
    fireEvent.press(getByText('Next'));
    expect(getByText('When is it?')).toBeTruthy();
  });

  it('navigates through all steps', () => {
    const { getByText, getByPlaceholderText } = render(<NightCreateScreen />);

    // Step 1: Name
    fireEvent.changeText(getByPlaceholderText('e.g. Friday Pub Crawl'), 'Test Night');
    fireEvent.press(getByText('Next'));

    // Step 2: Date — auto-selected by mock DateTimePicker
    fireEvent.press(getByText('Select a date'));
    fireEvent.press(getByText('Next'));

    // Step 3: Theme (optional)
    expect(getByText('Any theme? (optional)')).toBeTruthy();
    fireEvent.press(getByText('Next'));

    // Step 4: Budget (optional)
    expect(getByText('Budget per person? (optional)')).toBeTruthy();
    expect(getByText('Create')).toBeTruthy();
  });

  it('goes back between steps', () => {
    const { getByText, getByPlaceholderText } = render(<NightCreateScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. Friday Pub Crawl'), 'Test Night');
    fireEvent.press(getByText('Next'));
    expect(getByText('When is it?')).toBeTruthy();

    fireEvent.press(getByText('Back'));
    expect(getByText("What's the night called?")).toBeTruthy();
  });

  it('calls cancel (router.back) from first step', () => {
    const { getByText } = render(<NightCreateScreen />);
    fireEvent.press(getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('submits and navigates to night detail on success', async () => {
    const mockNight = {
      id: 'night-new',
      name: 'Test Night',
      date: '2026-04-12',
      theme: null,
      budget: null,
      status: 'planning',
      organiser: { id: 'c-1', name: 'Test', email: 'test@example.com', phone: null, avatar: null, email_verified_at: null, created_at: '', updated_at: '' },
      members_count: 1,
      itinerary_count: 0,
      members: [],
      itinerary: [],
      invites: [],
      created_at: '',
      updated_at: '',
    };
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { night: mockNight } });

    const { getByText, getByPlaceholderText } = render(<NightCreateScreen />);

    // Step through all
    fireEvent.changeText(getByPlaceholderText('e.g. Friday Pub Crawl'), 'Test Night');
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Select a date'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/nights', expect.objectContaining({
        name: 'Test Night',
      }));
      expect(mockReplace).toHaveBeenCalledWith('/(app)/nights/night-new');
    });
  });

  it('shows error on API failure', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'The name field is required.' } },
    });

    const { getByText, getByPlaceholderText, findByText } = render(<NightCreateScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. Friday Pub Crawl'), 'Test Night');
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Select a date'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Create'));

    expect(await findByText('The name field is required.')).toBeTruthy();
  });
});
