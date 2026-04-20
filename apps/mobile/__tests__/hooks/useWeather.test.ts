import { renderHook } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — before import
// ---------------------------------------------------------------------------

const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194 },
  }),
  Accuracy: { Balanced: 3 },
}));

jest.mock('../../services/weather', () => ({
  fetchCurrentWeather: jest.fn().mockResolvedValue({ temp: 72, condition: 'Sunny' }),
  fetchWeatherForecast: jest.fn().mockResolvedValue([]),
  getWorkoutRecommendation: jest.fn().mockReturnValue({ recommendation: 'Go for it!' }),
}));

import { useWeather } from '../../hooks/useWeather';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns weather from useQuery data', () => {
    const weather = { temp: 72, condition: 'Sunny', humidity: 55 };
    mockUseQuery.mockReturnValue({
      data: { weather, forecast: [], workoutContext: null },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.weather).toEqual(weather);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null weather when data is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.weather).toBeNull();
  });

  it('returns loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns forecast from data', () => {
    const forecast = [{ day: 'Mon', high: 75 }, { day: 'Tue', high: 70 }];
    mockUseQuery.mockReturnValue({
      data: { weather: null, forecast, workoutContext: null },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.forecast).toEqual(forecast);
  });

  it('returns empty forecast array when data missing', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.forecast).toEqual([]);
  });

  it('returns error from useQuery', () => {
    const err = new Error('Location denied');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: err,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.error).toBe(err);
  });

  it('provides refetch function', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(typeof result.current.refetch).toBe('function');
  });

  it('returns workoutContext from data', () => {
    const workoutContext = { recommendation: 'Perfect for outdoor training', score: 9 };
    mockUseQuery.mockReturnValue({
      data: { weather: { temp: 70 }, forecast: [], workoutContext },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useWeather());
    expect(result.current.workoutContext).toEqual(workoutContext);
  });
});
