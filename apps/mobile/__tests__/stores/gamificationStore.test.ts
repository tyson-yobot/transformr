import { useGamificationStore } from '../../stores/gamificationStore';
import type { CoachingTone } from '../../stores/gamificationStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});
const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['update', 'eq'].forEach((m) => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
  useGamificationStore.setState({ tone: 'motivational' });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('defaults to motivational tone', () => {
    expect(useGamificationStore.getState().tone).toBe('motivational');
  });
});

// ---------------------------------------------------------------------------
// setTone
// ---------------------------------------------------------------------------

describe('setTone', () => {
  const tones: CoachingTone[] = ['drill_sergeant', 'motivational', 'balanced', 'calm'];

  tones.forEach((tone) => {
    it(`sets tone to ${tone}`, () => {
      useGamificationStore.getState().setTone(tone);
      expect(useGamificationStore.getState().tone).toBe(tone);
    });
  });

  it('updates state immediately (optimistic)', () => {
    // setTone is synchronous for state; Supabase sync is fire-and-forget
    useGamificationStore.getState().setTone('calm');
    expect(useGamificationStore.getState().tone).toBe('calm');
  });

  it('calls Supabase in the background when authenticated', async () => {
    useGamificationStore.getState().setTone('drill_sergeant');
    // Allow micro-tasks to flush
    await Promise.resolve();
    await Promise.resolve();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('handles unauthenticated state silently', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    useGamificationStore.getState().setTone('balanced');
    await Promise.resolve();
    await Promise.resolve();
    // from() should not have been called (no user)
    expect(mockFrom).not.toHaveBeenCalled();
    // State should still update
    expect(useGamificationStore.getState().tone).toBe('balanced');
  });

  it('handles Supabase error silently', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));
    useGamificationStore.getState().setTone('calm');
    await Promise.resolve();
    await Promise.resolve();
    // State should still be updated despite error
    expect(useGamificationStore.getState().tone).toBe('calm');
  });
});
