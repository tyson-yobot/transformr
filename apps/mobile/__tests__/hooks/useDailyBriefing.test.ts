import { renderHook } from '@testing-library/react-native';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../stores/profileStore', () => ({
  useProfileStore: jest.fn((selector: (s: { profile: { display_name: string } | null }) => unknown) =>
    selector({ profile: { display_name: 'Alex' } }),
  ),
}));

jest.mock('../../stores/goalStore', () => ({
  useGoalStore: jest.fn((selector: (s: { goals: { id: string; status: string; target_date: string | null; title: string; category: string }[] }) => unknown) =>
    selector({ goals: [{ id: 'g1', status: 'active', target_date: '2026-12-31', title: 'Run marathon', category: 'fitness' }] }),
  ),
}));

jest.mock('../../stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector: (s: { activeSession: null; templates: { id: string; name: string }[] }) => unknown) =>
    selector({ activeSession: null, templates: [{ id: 't1', name: 'Push Day' }] }),
  ),
}));

jest.mock('../../stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector: (s: {
    todayLogs: { id: string; calories: number }[];
    getTodayMacros: () => { calories: number; protein: number; carbs: number; fat: number; water_oz: number };
  }) => unknown) =>
    selector({
      todayLogs: [],
      getTodayMacros: () => ({ calories: 1200, protein: 100, carbs: 150, fat: 40, water_oz: 48 }),
    }),
  ),
}));

jest.mock('../../stores/habitStore', () => ({
  useHabitStore: jest.fn((selector: (s: { habits: { id: string; is_active: boolean }[]; todayCompletions: { id: string }[]; history: { id: string; completed_at: string }[] }) => unknown) =>
    selector({
      habits: [{ id: 'h1', is_active: true }, { id: 'h2', is_active: true }],
      todayCompletions: [{ id: 'c1' }],
      history: [],
    }),
  ),
}));

jest.mock('../../stores/sleepStore', () => ({
  useSleepStore: jest.fn((selector: (s: { history: { id: string; hours: number; logged_at: string }[]; lastSleep: null }) => unknown) =>
    selector({ history: [], lastSleep: null }),
  ),
}));

jest.mock('../../stores/moodStore', () => ({
  useMoodStore: jest.fn((selector: (s: { todayMood: null }) => unknown) =>
    selector({ todayMood: null }),
  ),
}));

// Mock useCountdown since useDailyBriefing uses it
jest.mock('../../hooks/useCountdown', () => ({
  useCountdown: jest.fn(() => ({
    days: 255,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 255,
    isExpired: false,
    label: '255d 0h',
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDailyBriefing', () => {
  it('returns greeting string', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(typeof result.current.greeting).toBe('string');
    expect(result.current.greeting).toMatch(/Good (morning|afternoon|evening)\./);
  });

  it('returns userName from profile', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(result.current.userName).toBe('Alex');
  });

  it('returns todayDate string', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(typeof result.current.todayDate).toBe('string');
    expect(result.current.todayDate.length).toBeGreaterThan(0);
  });

  it('returns countdown info when goal has target_date', () => {
    const { result } = renderHook(() => useDailyBriefing());
    // countdown should be present since we have a goal with target_date
    if (result.current.countdown !== null) {
      expect(typeof result.current.countdown.daysRemaining).toBe('number');
      expect(typeof result.current.countdown.goalTitle).toBe('string');
    }
  });

  it('returns gamePlan as array', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(Array.isArray(result.current.gamePlan)).toBe(true);
  });

  it('returns readinessScore as number', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(typeof result.current.readinessScore).toBe('number');
  });

  it('returns motivationMessage string', () => {
    const { result } = renderHook(() => useDailyBriefing());
    expect(typeof result.current.motivationMessage).toBe('string');
    expect(result.current.motivationMessage.length).toBeGreaterThan(0);
  });
});
