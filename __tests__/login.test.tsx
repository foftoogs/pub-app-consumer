import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';

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
    post: jest.fn(),
  },
}));

import api from '../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders email input and send code button', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email address')).toBeTruthy();
    expect(getByText('Send code')).toBeTruthy();
  });

  it('disables button when email is empty', () => {
    const { getByText } = render(<LoginScreen />);
    const button = getByText('Send code');
    expect(button.parent?.props.accessibilityState?.disabled ?? button.parent?.parent?.props.disabled).toBeTruthy;
  });

  it('calls request-otp and navigates on success', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'OTP sent' } });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email address'), 'test@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/consumer/auth/request-otp', {
        email: 'test@example.com',
      });
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/verify',
        params: { email: 'test@example.com' },
      });
    });
  });

  it('shows error message on API failure', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Invalid email address' } },
    });

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email address'), 'bad@email');
    fireEvent.press(getByText('Send code'));

    expect(await findByText('Invalid email address')).toBeTruthy();
  });
});
