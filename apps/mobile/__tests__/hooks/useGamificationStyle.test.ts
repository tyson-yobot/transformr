import { renderHook, act } from '@testing-library/react-native';

type CoachingTone = 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';

const mockSetTone = jest.fn();

let mockTone: CoachingTone = 'balanced';

jest.mock('../../stores/gamificationStore', () => ({
  useGamificationStore: jest.fn(
    (selector: (s: { tone: CoachingTone; setTone: jest.Mock }) => unknown) =>
      selector({ tone: mockTone, setTone: mockSetTone }),
  ),
  CoachingTone: {},
}));

jest.mock('../../theme/index', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      accent: {
        primary: '#6366f1',
        secondary: '#a5b4fc',
      },
    },
  })),
}));

import { useGamificationStyle } from '../../hooks/useGamificationStyle';

describe('useGamificationStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTone = 'balanced';
  });

  it('returns a result object with all expected fields', () => {
    const { result } = renderHook(() => useGamificationStyle());
    expect(typeof result.current.style).toBe('object');
    expect(typeof result.current.tone).toBe('string');
    expect(typeof result.current.isDrillSergeant).toBe('boolean');
    expect(typeof result.current.isMotivational).toBe('boolean');
    expect(typeof result.current.isBalanced).toBe('boolean');
    expect(typeof result.current.isCalm).toBe('boolean');
    expect(typeof result.current.setTone).toBe('function');
  });

  it('isDrillSergeant is false for "balanced" tone', () => {
    mockTone = 'balanced';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.isDrillSergeant).toBe(false);
    expect(result.current.isBalanced).toBe(true);
  });

  it('isDrillSergeant is true for "drill_sergeant" tone', () => {
    mockTone = 'drill_sergeant';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.isDrillSergeant).toBe(true);
    expect(result.current.isBalanced).toBe(false);
  });

  it('isMotivational is true for "motivational" tone', () => {
    mockTone = 'motivational';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.isMotivational).toBe(true);
    expect(result.current.isDrillSergeant).toBe(false);
  });

  it('isCalm is true for "calm" tone', () => {
    mockTone = 'calm';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.isCalm).toBe(true);
    expect(result.current.isMotivational).toBe(false);
  });

  it('style.tone matches the active tone', () => {
    mockTone = 'drill_sergeant';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.style.tone).toBe('drill_sergeant');
  });

  it('style has required GamificationStyle fields', () => {
    const { result } = renderHook(() => useGamificationStyle());
    const { style } = result.current;
    expect(typeof style.achievementLabel).toBe('string');
    expect(typeof style.streakLabel).toBe('string');
    expect(typeof style.missedDayLabel).toBe('string');
    expect(typeof style.progressLabel).toBe('string');
    expect(typeof style.primaryColor).toBe('string');
    expect(typeof style.showFireEmojis).toBe('boolean');
    expect(typeof style.showLeaderboard).toBe('boolean');
    expect(style.cardElevation === 'high' || style.cardElevation === 'normal').toBe(true);
    expect(['intense', 'neutral', 'calm'].includes(style.motivationStyle)).toBe(true);
  });

  it('setTone calls the store setTone function', () => {
    const { result } = renderHook(() => useGamificationStyle());

    act(() => {
      result.current.setTone('calm');
    });

    expect(mockSetTone).toHaveBeenCalledWith('calm');
  });

  it('drill_sergeant style uses intense motivationStyle', () => {
    mockTone = 'drill_sergeant';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.style.motivationStyle).toBe('intense');
  });

  it('calm style uses calm motivationStyle', () => {
    mockTone = 'calm';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.style.motivationStyle).toBe('calm');
  });

  it('balanced style uses neutral motivationStyle and no fire emojis', () => {
    mockTone = 'balanced';
    const { result } = renderHook(() => useGamificationStyle());
    expect(result.current.style.motivationStyle).toBe('neutral');
    expect(result.current.style.showFireEmojis).toBe(false);
  });
});
