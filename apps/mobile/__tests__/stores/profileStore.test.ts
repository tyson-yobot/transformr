import { act } from '@testing-library/react-native';
import { useProfileStore } from '../../stores/profileStore';
import type { Profile } from '../../types/database';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123', email: 'test@example.com', user_metadata: { display_name: 'Test User' } } },
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

function makeChain(result: { data: unknown; error: null | { message: string; code?: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'single', 'update', 'upsert'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

const MOCK_PROFILE: Profile = {
  id: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as Profile;

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has null profile', () => {
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('is not loading', () => {
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('has null error', () => {
    expect(useProfileStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error state', () => {
    useProfileStore.setState({ error: 'Some error' });
    useProfileStore.getState().clearError();
    expect(useProfileStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('resets all state', () => {
    useProfileStore.setState({ profile: MOCK_PROFILE, isLoading: true, error: 'err' });
    useProfileStore.getState().reset();
    expect(useProfileStore.getState().profile).toBeNull();
    expect(useProfileStore.getState().isLoading).toBe(false);
    expect(useProfileStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchProfile
// ---------------------------------------------------------------------------

describe('fetchProfile', () => {
  it('loads profile from database', async () => {
    mockFrom.mockReturnValue(makeChain({ data: MOCK_PROFILE, error: null }));

    await act(async () => {
      await useProfileStore.getState().fetchProfile();
    });

    expect(useProfileStore.getState().profile?.id).toBe('user-123');
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('creates profile when row does not exist (PGRST116)', async () => {
    const chain1 = makeChain({ data: null, error: { message: 'no rows', code: 'PGRST116' } });
    const chain2 = makeChain({ data: MOCK_PROFILE, error: null });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? chain1 : chain2;
    });

    await act(async () => {
      await useProfileStore.getState().fetchProfile();
    });

    expect(useProfileStore.getState().profile?.id).toBe('user-123');
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useProfileStore.getState().fetchProfile();
    });

    expect(useProfileStore.getState().error).toBe('Not authenticated');
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('sets error when Supabase query fails with non-PGRST116 error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error', code: 'DB_ERR' } }));

    await act(async () => {
      await useProfileStore.getState().fetchProfile();
    });

    expect(useProfileStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

describe('updateProfile', () => {
  it('updates profile with existing profile in state', async () => {
    useProfileStore.setState({ profile: MOCK_PROFILE });
    const updatedProfile = { ...MOCK_PROFILE, display_name: 'Updated Name' };
    mockFrom.mockReturnValue(makeChain({ data: updatedProfile, error: null }));

    await act(async () => {
      await useProfileStore.getState().updateProfile({ display_name: 'Updated Name' });
    });

    expect(useProfileStore.getState().profile?.display_name).toBe('Updated Name');
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('upserts when no profile in state', async () => {
    mockFrom.mockReturnValue(makeChain({ data: MOCK_PROFILE, error: null }));

    await act(async () => {
      await useProfileStore.getState().updateProfile({ display_name: 'New User' });
    });

    expect(useProfileStore.getState().profile).not.toBeNull();
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    useProfileStore.setState({ profile: MOCK_PROFILE });
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }));

    await act(async () => {
      await useProfileStore.getState().updateProfile({ display_name: 'Fail' });
    });

    expect(useProfileStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// setTheme
// ---------------------------------------------------------------------------

describe('setTheme', () => {
  it('delegates to updateProfile with theme field', async () => {
    useProfileStore.setState({ profile: MOCK_PROFILE });
    const updated = { ...MOCK_PROFILE, theme: 'light' as Profile['theme'] };
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));

    await act(async () => {
      await useProfileStore.getState().setTheme('light');
    });

    expect(useProfileStore.getState().profile?.theme).toBe('light');
  });
});
