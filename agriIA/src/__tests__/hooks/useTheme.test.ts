import { renderHook } from '@testing-library/react-native';
import { Colors } from '@/constants/theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const mockUseColorScheme = useColorScheme as jest.Mock;

describe('useTheme', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns light colors when scheme is "light"', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });

  it('returns dark colors when scheme is "dark"', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(Colors.dark);
  });

  it('falls back to light when scheme is "unspecified"', () => {
    mockUseColorScheme.mockReturnValue('unspecified');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });
});
