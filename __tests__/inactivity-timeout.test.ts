import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useInactivityTimeout } from '../hooks/use-inactivity-timeout';
import { useAuthStore } from '../features/auth/store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve()),
  },
}));

beforeEach(() => {
  jest.useFakeTimers({ legacyFakeTimers: false });
  useAuthStore.setState({ consumer: null, token: null, isReady: true });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useInactivityTimeout', () => {
  it('does not log out before 10 minutes', () => {
    useAuthStore.setState({ token: 'test-token' });
    renderHook(() => useInactivityTimeout());

    act(() => {
      jest.advanceTimersByTime(9 * 60 * 1000);
    });

    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('logs out after 10 minutes of inactivity', async () => {
    useAuthStore.setState({ token: 'test-token' });
    renderHook(() => useInactivityTimeout());

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  it('resets timer on resetTimer call', async () => {
    useAuthStore.setState({ token: 'test-token' });
    const { result } = renderHook(() => useInactivityTimeout());

    act(() => {
      jest.advanceTimersByTime(8 * 60 * 1000);
    });

    // Reset the timer (simulating user touch)
    act(() => {
      result.current();
    });

    // Advance another 8 minutes (only 8 from last reset)
    act(() => {
      jest.advanceTimersByTime(8 * 60 * 1000);
    });

    expect(useAuthStore.getState().token).toBe('test-token');

    // Now advance the remaining 2 minutes to hit the timeout
    act(() => {
      jest.advanceTimersByTime(2 * 60 * 1000);
    });

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  it('logs out on app resume after timeout elapsed', async () => {
    useAuthStore.setState({ token: 'test-token' });
    renderHook(() => useInactivityTimeout());

    const addSpy = jest.spyOn(AppState, 'addEventListener');
    const appStateHandler = addSpy.mock.calls[0][1] as (state: string) => void;

    // Go to background
    act(() => {
      appStateHandler('background');
    });

    // Simulate real time passing (Date.now advances with fake timers)
    act(() => {
      jest.advanceTimersByTime(11 * 60 * 1000);
    });

    // Come back to foreground
    act(() => {
      appStateHandler('active');
    });

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  it('does not start timer when not authenticated', () => {
    useAuthStore.setState({ token: null });
    renderHook(() => useInactivityTimeout());

    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(useAuthStore.getState().token).toBeNull();
  });
});
