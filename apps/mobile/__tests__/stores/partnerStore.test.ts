import { act } from '@testing-library/react-native';
import { usePartnerStore } from '../../stores/partnerStore';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

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
  ['select', 'eq', 'or', 'maybeSingle', 'single', 'insert', 'update', 'order', 'limit'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  usePartnerStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has null partnership', () => {
    expect(usePartnerStore.getState().partnership).toBeNull();
  });

  it('has null pendingInviteCode', () => {
    expect(usePartnerStore.getState().pendingInviteCode).toBeNull();
  });

  it('is not loading', () => {
    expect(usePartnerStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset / setPendingInviteCode
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    usePartnerStore.setState({ error: 'Oops' });
    usePartnerStore.getState().clearError();
    expect(usePartnerStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    usePartnerStore.setState({ partnership: { id: '1' } as never, error: 'err' });
    usePartnerStore.getState().reset();
    expect(usePartnerStore.getState().partnership).toBeNull();
    expect(usePartnerStore.getState().error).toBeNull();
  });
});

describe('setPendingInviteCode', () => {
  it('sets invite code', () => {
    usePartnerStore.getState().setPendingInviteCode('TFR-ABCDEF');
    expect(usePartnerStore.getState().pendingInviteCode).toBe('TFR-ABCDEF');
  });

  it('clears invite code with null', () => {
    usePartnerStore.setState({ pendingInviteCode: 'TFR-ABCDEF' });
    usePartnerStore.getState().setPendingInviteCode(null);
    expect(usePartnerStore.getState().pendingInviteCode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchPartnership
// ---------------------------------------------------------------------------

describe('fetchPartnership', () => {
  it('sets partnership and partner profile when active partnership exists', async () => {
    const partnership = { id: 'partner-1', user_a: 'user-123', user_b: 'user-456', status: 'active' };
    const partnerProfile = { id: 'user-456', display_name: 'Partner', email: 'partner@example.com' };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: partnership, error: null }); // partnerships
      return makeChain({ data: partnerProfile, error: null }); // profiles
    });

    await act(async () => {
      await usePartnerStore.getState().fetchPartnership();
    });

    expect(usePartnerStore.getState().partnership?.id).toBe('partner-1');
    expect(usePartnerStore.getState().partnerProfile?.id).toBe('user-456');
    expect(usePartnerStore.getState().isLoading).toBe(false);
  });

  it('sets null partnership when no active partnership', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await usePartnerStore.getState().fetchPartnership();
    });

    expect(usePartnerStore.getState().partnership).toBeNull();
    expect(usePartnerStore.getState().partnerProfile).toBeNull();
    expect(usePartnerStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await usePartnerStore.getState().fetchPartnership();
    });

    expect(usePartnerStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// createPartnershipInvite
// ---------------------------------------------------------------------------

describe('createPartnershipInvite', () => {
  it('creates an invite and returns the invite code', async () => {
    const newPartnership = { id: 'partner-new', invite_code: 'TFR-ABCDEF', status: 'pending' };
    mockFrom.mockReturnValue(makeChain({ data: newPartnership, error: null }));

    const code = await usePartnerStore.getState().createPartnershipInvite();

    expect(typeof code).toBe('string');
  });

  it('returns null when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const code = await usePartnerStore.getState().createPartnershipInvite();

    expect(code).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sendNudge
// ---------------------------------------------------------------------------

describe('sendNudge', () => {
  it('sends a nudge successfully', async () => {
    usePartnerStore.setState({ partnership: { id: 'partner-1', user_a: 'user-123', user_b: 'user-456' } as never });
    mockFrom.mockReturnValue(makeChain({ data: { id: 'nudge-1' }, error: null }));

    await act(async () => {
      await usePartnerStore.getState().sendNudge('workout', 'Great job today!');
    });

    expect(usePartnerStore.getState().error).toBeNull();
  });
});
