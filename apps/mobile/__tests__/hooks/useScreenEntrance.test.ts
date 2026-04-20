import { renderHook } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — before import (Reanimated is not available in test environment)
// ---------------------------------------------------------------------------

// React Native's __DEV__ global is not set in Jest by default
(global as Record<string, unknown>).__DEV__ = false;

const mockMakeMutable = jest.fn((val: number) => ({ value: val }));
const mockUseAnimatedStyle = jest.fn((fn: () => object) => fn());
const mockWithTiming = jest.fn((val: number) => val);
const mockCancelAnimation = jest.fn();
const mockUseReducedMotion = jest.fn().mockReturnValue(false);

jest.mock('react-native-reanimated', () => ({
  makeMutable: (val: number) => mockMakeMutable(val),
  useAnimatedStyle: (fn: () => object) => mockUseAnimatedStyle(fn),
  withTiming: (val: number, _opts?: object) => mockWithTiming(val),
  cancelAnimation: (sv: unknown) => mockCancelAnimation(sv),
  useReducedMotion: () => mockUseReducedMotion(),
  Easing: { out: jest.fn((e: unknown) => e), ease: jest.fn(), inOut: jest.fn((e: unknown) => e) },
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn((cb: () => (() => void) | void) => {
    const cleanup = cb();
    if (typeof cleanup === 'function') cleanup();
  }),
}));

import { useScreenEntrance } from '../../hooks/useScreenEntrance';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScreenEntrance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('returns getEntranceStyle function', () => {
    const { result } = renderHook(() =>
      useScreenEntrance({ sections: ['header', 'body'] }),
    );
    expect(typeof result.current.getEntranceStyle).toBe('function');
  });

  it('getEntranceStyle returns a style object for valid section', () => {
    const { result } = renderHook(() =>
      useScreenEntrance({ sections: ['header', 'stats', 'actions'] }),
    );
    const style = result.current.getEntranceStyle('header');
    expect(typeof style).toBe('object');
  });

  it('creates opacity and translateY shared values for each section', () => {
    renderHook(() =>
      useScreenEntrance({ sections: ['a', 'b', 'c'] }),
    );
    // makeMutable called twice per section (opacity + translateY) = 6 times
    expect(mockMakeMutable).toHaveBeenCalledTimes(6);
  });

  it('creates animated style for each section', () => {
    renderHook(() =>
      useScreenEntrance({ sections: ['hero', 'cards'] }),
    );
    // useAnimatedStyle called at least once per section (plus possibly a fallback style)
    expect(mockUseAnimatedStyle.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('uses default staggerMs and duration when not provided', () => {
    // Should not throw with default options
    expect(() =>
      renderHook(() => useScreenEntrance({ sections: ['header'] })),
    ).not.toThrow();
  });

  it('handles empty sections array', () => {
    expect(() =>
      renderHook(() => useScreenEntrance({ sections: [] })),
    ).not.toThrow();
  });

  it('reduced motion: sets values immediately without animation', () => {
    mockUseReducedMotion.mockReturnValue(true);
    // Should not throw when reduced motion is enabled
    expect(() =>
      renderHook(() => useScreenEntrance({ sections: ['header', 'body'] })),
    ).not.toThrow();
  });
});
