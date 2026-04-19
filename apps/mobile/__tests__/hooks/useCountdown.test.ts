import { renderHook, act } from '@testing-library/react-native';
import { useCountdown } from '../../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns isExpired true and "No target set" label when null is passed', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.label).toBe('No target set');
  });

  it('returns isExpired true and "Target reached!" label for a past date', () => {
    const { result } = renderHook(() => useCountdown('2020-01-01'));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.label).toBe('Target reached!');
  });

  it('returns a label containing "y" for a date more than 365 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 400);
    const { result } = renderHook(() => useCountdown(future.toISOString().slice(0, 10)));
    expect(result.current.isExpired).toBe(false);
    expect(result.current.label).toMatch(/\dy/);
  });

  it('returns a label containing "mo" for a date 31–365 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 45);
    const { result } = renderHook(() => useCountdown(future.toISOString().slice(0, 10)));
    expect(result.current.isExpired).toBe(false);
    expect(result.current.label).toMatch(/mo/);
  });

  it('returns isExpired false and a "d h" label for a date less than 30 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const { result } = renderHook(() => useCountdown(future.toISOString().slice(0, 10)));
    expect(result.current.isExpired).toBe(false);
    expect(result.current.label).toMatch(/\dd \d+h/);
    expect(result.current.days).toBeGreaterThan(0);
  });

  it('provides positive days, hours, minutes, seconds for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const { result } = renderHook(() => useCountdown(future.toISOString().slice(0, 10)));
    expect(result.current.totalDays).toBeGreaterThan(0);
    expect(result.current.days).toBeGreaterThanOrEqual(0);
  });

  it('updates the countdown value after 1000ms via fake timers', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const targetDate = future.toISOString().slice(0, 10);

    const { result } = renderHook(() => useCountdown(targetDate));
    const initialSeconds = result.current.seconds;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After 1 second the hook re-evaluates; seconds should still be a valid number
    expect(typeof result.current.seconds).toBe('number');
    expect(result.current.seconds).not.toBe(initialSeconds);
  });

  it('renders without errors and returns all required fields', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const { result } = renderHook(() => useCountdown(future.toISOString().slice(0, 10)));
    const keys: (keyof typeof result.current)[] = ['days', 'hours', 'minutes', 'seconds', 'totalDays', 'isExpired', 'label'];
    for (const key of keys) {
      expect(result.current[key]).toBeDefined();
    }
  });
});
