import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VerifyScreen from '../app/(auth)/verify';
import { useAuthStore } from '../stores/auth';

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
  useLocalSearchParams: () => ({ email: 'test@example.com' }),
}));

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

const mockConsumer = {
  id: '019d5c11-961c-72cd-9224-170b12ec2b71',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  email_verified_at: '2026-04-05T00:00:00.000Z',
  created_at: '2026-04-05T00:00:00.000Z',
  updated_at: '2026-04-05T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ consumer: null, token: null, isReady: false });
  jest.clearAllMocks();
});

describe('VerifyScreen', () => {
  it('renders OTP input and verify button', () => {
    const { getByPlaceholderText, getByText } = render(<VerifyScreen />);
    expect(getByPlaceholderText('000000')).toBeTruthy();
    expect(getByText('Verify')).toBeTruthy();
  });

  it('shows the email address from route params', () => {
    const { getByText } = render(<VerifyScreen />);
    expect(getByText('We sent a 6-digit code to test@example.com')).toBeTruthy();
  });

  it('verifies OTP, stores auth, and navigates to nights', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({
      data: { consumer: mockConsumer, token: 'new-token-123' },
    });

    const { getByPlaceholderText, getByText } = render(<VerifyScreen />);
    fireEvent.changeText(getByPlaceholderText('000000'), '123456');
    fireEvent.press(getByText('Verify'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/auth/verify-otp', {
        email: 'test@example.com',
        code: '123456',
      });
      expect(mockReplace).toHaveBeenCalledWith('/(app)/home');
    });

    const state = useAuthStore.getState();
    expect(state.consumer).toEqual(mockConsumer);
    expect(state.token).toBe('new-token-123');
  });

  it('shows error on invalid OTP', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'The provided OTP is invalid or has expired.' } },
    });

    const { getByPlaceholderText, getByText, findByText } = render(<VerifyScreen />);
    fireEvent.changeText(getByPlaceholderText('000000'), '000000');
    fireEvent.press(getByText('Verify'));

    expect(await findByText('The provided OTP is invalid or has expired.')).toBeTruthy();
  });

  it('navigates back when "Use a different email" is pressed', () => {
    const { getByText } = render(<VerifyScreen />);
    fireEvent.press(getByText('Use a different email'));
    expect(mockBack).toHaveBeenCalled();
  });
});
