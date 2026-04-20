import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — must come before hook import
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

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'order', 'update', 'then'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  );
  return chain;
}

const mockFrom = jest.fn();
jest.mock('../../services/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useSmartNotifications } from '../../hooks/useSmartNotifications';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSmartNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it('returns rules from useQuery data', () => {
    const rules = [
      { id: 'r1', trigger_type: 'missed_workout', is_enabled: true },
    ];
    mockUseQuery.mockReturnValue({ data: rules, isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.rules).toEqual(rules);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty rules when useQuery data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.rules).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error from useQuery', () => {
    const err = new Error('Fetch failed');
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: err });
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });

    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.error).toBe(err);
  });

  it('toggleRule calls mutation with ruleId and enabled', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });

    const { result } = renderHook(() => useSmartNotifications());
    await act(async () => {
      await result.current.toggleRule('r-1', false);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ ruleId: 'r-1', isEnabled: false });
  });

  it('isToggling reflects mutation isPending state', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn(), isPending: true });

    const { result } = renderHook(() => useSmartNotifications());
    expect(result.current.isToggling).toBe(true);
  });
});
