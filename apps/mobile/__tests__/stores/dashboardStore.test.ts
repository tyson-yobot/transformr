import { act } from '@testing-library/react-native';
import { useDashboardStore } from '../../stores/dashboardStore';

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
  ['select', 'eq', 'upsert', 'update', 'maybeSingle'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

const RESET_STATE = {
  isLoading: false,
  error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useDashboardStore.setState(RESET_STATE);
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has a layout with widgets', () => {
    expect(useDashboardStore.getState().layout.length).toBeGreaterThan(0);
  });

  it('is not loading', () => {
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('has null error', () => {
    expect(useDashboardStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears existing error', () => {
    useDashboardStore.setState({ error: 'Some error' });
    useDashboardStore.getState().clearError();
    expect(useDashboardStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchLayout
// ---------------------------------------------------------------------------

describe('fetchLayout', () => {
  it('loads layout from database when data exists', async () => {
    const dbLayout = {
      id: 'layout-1',
      user_id: 'user-123',
      name: 'default',
      is_active: true,
      layout: { widgets: [{ id: 'workout-summary', type: 'workout_summary', title: 'Workout Summary', size: 'medium', position: 0, visible: true, config: {} }] },
    };
    mockFrom.mockReturnValue(makeChain({ data: dbLayout, error: null }));

    await act(async () => {
      await useDashboardStore.getState().fetchLayout();
    });

    expect(useDashboardStore.getState().layout).toHaveLength(1);
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('uses default widgets when no database record exists', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useDashboardStore.getState().fetchLayout();
    });

    expect(useDashboardStore.getState().layout.length).toBeGreaterThan(0);
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useDashboardStore.getState().fetchLayout();
    });

    expect(useDashboardStore.getState().error).toBe('Not authenticated');
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('sets error when Supabase query fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));

    await act(async () => {
      await useDashboardStore.getState().fetchLayout();
    });

    expect(useDashboardStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// saveLayout
// ---------------------------------------------------------------------------

describe('saveLayout', () => {
  const newLayout = [
    { id: 'workout-summary', type: 'workout_summary', title: 'Workout Summary', size: 'medium' as const, position: 0, visible: true, config: {} },
  ];

  it('saves layout and updates state', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useDashboardStore.getState().saveLayout(newLayout);
    });

    expect(useDashboardStore.getState().layout).toEqual(newLayout);
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useDashboardStore.getState().saveLayout(newLayout);
    });

    expect(useDashboardStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when upsert fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Upsert failed' } }));

    await act(async () => {
      await useDashboardStore.getState().saveLayout(newLayout);
    });

    expect(useDashboardStore.getState().error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// resetToDefault
// ---------------------------------------------------------------------------

describe('resetToDefault', () => {
  it('resets to default layout and persists', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useDashboardStore.getState().resetToDefault();
    });

    // Default widgets should be restored
    expect(useDashboardStore.getState().layout.length).toBeGreaterThan(0);
    expect(useDashboardStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useDashboardStore.getState().resetToDefault();
    });

    expect(useDashboardStore.getState().error).toBe('Not authenticated');
  });

  it('sets error when Supabase upsert fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Reset failed' } }));

    await act(async () => {
      await useDashboardStore.getState().resetToDefault();
    });

    expect(useDashboardStore.getState().error).toBeTruthy();
  });
});
