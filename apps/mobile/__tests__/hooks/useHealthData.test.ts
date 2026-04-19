import { renderHook } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — before import
// ---------------------------------------------------------------------------

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'u-1' } }),
  ),
}));

jest.mock('../../services/health', () => ({
  isHealthAvailable: jest.fn().mockResolvedValue(false),
  requestHealthPermissions: jest.fn().mockResolvedValue(false),
  fetchTodaySteps: jest.fn().mockResolvedValue(0),
  fetchHeartRateData: jest.fn().mockResolvedValue([]),
  fetchSleepData: jest.fn().mockResolvedValue(null),
  fetchWeightHistory: jest.fn().mockResolvedValue([]),
}));

const mockFrom = jest.fn();
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { useHealthData } from '../../hooks/useHealthData';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHealthData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it('returns steps from useQuery data', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: { steps: 8000, heartRate: [], sleep: null, weight: [] }, isLoading: false, error: null })
      .mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { result } = renderHook(() => useHealthData());
    expect(result.current.steps).toBe(8000);
  });

  it('returns 0 steps when data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { result } = renderHook(() => useHealthData());
    expect(result.current.steps).toBe(0);
  });

  it('isLoading reflects useQuery loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { result } = renderHook(() => useHealthData());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns heartRate array from data', () => {
    const hr = [{ timestamp: '2026-04-18T08:00:00Z', bpm: 62 }];
    mockUseQuery
      .mockReturnValueOnce({ data: { steps: 0, heartRate: hr, sleep: null, weight: [] }, isLoading: false, error: null })
      .mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { result } = renderHook(() => useHealthData());
    expect(result.current.heartRate).toEqual(hr);
  });

  it('isAvailable defaults to false', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { result } = renderHook(() => useHealthData());
    expect(result.current.isAvailable).toBe(false);
  });
});
