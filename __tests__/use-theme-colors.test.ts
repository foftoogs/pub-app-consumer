import { renderHook } from '@testing-library/react-native';
import { useThemeColors } from '../hooks/use-theme-colors';
import { Colors } from '../constants/colors';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

import { useColorScheme } from '../hooks/use-color-scheme';

const mockUseColorScheme = useColorScheme as jest.Mock;

describe('useThemeColors', () => {
  it('returns light colors by default', () => {
    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(Colors.light);
  });

  it('returns dark colors when scheme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(Colors.dark);
  });

  it('falls back to light when scheme is null', () => {
    mockUseColorScheme.mockReturnValue(null);
    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(Colors.light);
  });
});
