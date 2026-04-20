import { act } from '@testing-library/react-native';
import { useSupplementsStore } from '../../stores/supplementsStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchUserSupplements = jest.fn();
const mockFetchTodayLogs = jest.fn();
const mockGetSupplementBudget = jest.fn();
const mockGetSupplementRecommendations = jest.fn();
const mockCreateUserSupplement = jest.fn();
const mockUpdateUserSupplement = jest.fn();
const mockDeleteUserSupplement = jest.fn();
const mockLogSupplementTaken = jest.fn();
const mockUpdateSupplementBudget = jest.fn();

jest.mock('../../services/ai/supplement', () => ({
  fetchUserSupplements: (...args: unknown[]) => mockFetchUserSupplements(...args),
  fetchTodayLogs: (...args: unknown[]) => mockFetchTodayLogs(...args),
  getSupplementBudget: (...args: unknown[]) => mockGetSupplementBudget(...args),
  getSupplementRecommendations: (...args: unknown[]) => mockGetSupplementRecommendations(...args),
  createUserSupplement: (...args: unknown[]) => mockCreateUserSupplement(...args),
  updateUserSupplement: (...args: unknown[]) => mockUpdateUserSupplement(...args),
  deleteUserSupplement: (...args: unknown[]) => mockDeleteUserSupplement(...args),
  logSupplementTaken: (...args: unknown[]) => mockLogSupplementTaken(...args),
  updateSupplementBudget: (...args: unknown[]) => mockUpdateSupplementBudget(...args),
}));

jest.mock('../../utils/storage', () => ({
  addToSyncQueue: jest.fn(),
  getSyncQueue: jest.fn().mockReturnValue([]),
  getStorageJSON: jest.fn().mockReturnValue(null),
  setStorageJSON: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSupplementsStore.setState({
    supplements: [],
    todayLogs: [],
    budget: 0,
    aiRecommendations: [],
    interactionWarnings: [],
    dailySchedule: {},
    totalEstimatedCost: 0,
    budgetFit: true,
    budgetNotes: '',
    isLoadingSupplements: false,
    isLoadingRecommendations: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty supplements', () => {
    expect(useSupplementsStore.getState().supplements).toHaveLength(0);
  });

  it('has empty todayLogs', () => {
    expect(useSupplementsStore.getState().todayLogs).toHaveLength(0);
  });

  it('has budget 0', () => {
    expect(useSupplementsStore.getState().budget).toBe(0);
  });

  it('is not loading', () => {
    expect(useSupplementsStore.getState().isLoadingSupplements).toBe(false);
    expect(useSupplementsStore.getState().isLoadingRecommendations).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useSupplementsStore.setState({ error: 'Oops' });
    useSupplementsStore.getState().clearError();
    expect(useSupplementsStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchAll
// ---------------------------------------------------------------------------

describe('fetchAll', () => {
  it('fetches supplements, todayLogs, and budget', async () => {
    const supplements = [{ id: 's1', name: 'Vitamin D', priority: 1 }];
    const todayLogs = [{ id: 'l1', supplement_id: 's1' }];
    const budget = 100;

    mockFetchUserSupplements.mockResolvedValueOnce(supplements);
    mockFetchTodayLogs.mockResolvedValueOnce(todayLogs);
    mockGetSupplementBudget.mockResolvedValueOnce(budget);

    await act(async () => {
      await useSupplementsStore.getState().fetchAll();
    });

    expect(useSupplementsStore.getState().supplements).toHaveLength(1);
    expect(useSupplementsStore.getState().todayLogs).toHaveLength(1);
    expect(useSupplementsStore.getState().budget).toBe(100);
    expect(useSupplementsStore.getState().isLoadingSupplements).toBe(false);
  });

  it('sets error when fetch fails', async () => {
    mockFetchUserSupplements.mockRejectedValueOnce(new Error('Fetch failed'));
    mockFetchTodayLogs.mockResolvedValueOnce([]);
    mockGetSupplementBudget.mockResolvedValueOnce(0);

    await act(async () => {
      await useSupplementsStore.getState().fetchAll();
    });

    expect(useSupplementsStore.getState().error).toBe('Fetch failed');
    expect(useSupplementsStore.getState().isLoadingSupplements).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchRecommendations
// ---------------------------------------------------------------------------

describe('fetchRecommendations', () => {
  it('fetches AI supplement recommendations', async () => {
    const response = {
      recommendations: [{ name: 'Omega-3', priority: 1 }],
      interactions_warnings: [],
      daily_schedule: { morning: ['Omega-3'] },
      total_estimated_monthly_cost: 30,
      budget_fit: true,
      budget_notes: 'Within budget',
    };
    mockGetSupplementRecommendations.mockResolvedValueOnce(response);

    await act(async () => {
      await useSupplementsStore.getState().fetchRecommendations('performance');
    });

    expect(useSupplementsStore.getState().aiRecommendations).toHaveLength(1);
    expect(useSupplementsStore.getState().budgetFit).toBe(true);
    expect(useSupplementsStore.getState().isLoadingRecommendations).toBe(false);
  });

  it('sets error when recommendations fail', async () => {
    mockGetSupplementRecommendations.mockRejectedValueOnce(new Error('AI error'));

    await act(async () => {
      await useSupplementsStore.getState().fetchRecommendations();
    });

    expect(useSupplementsStore.getState().error).toBe('AI error');
    expect(useSupplementsStore.getState().isLoadingRecommendations).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addSupplement
// ---------------------------------------------------------------------------

describe('addSupplement', () => {
  it('adds supplement and sorts by priority', async () => {
    useSupplementsStore.setState({
      supplements: [{ id: 's1', name: 'Vitamin C', priority: 2 } as never],
    });
    const created = { id: 's2', name: 'Magnesium', priority: 1 };
    mockCreateUserSupplement.mockResolvedValueOnce(created);

    await act(async () => {
      await useSupplementsStore.getState().addSupplement({ name: 'Magnesium', priority: 1 });
    });

    const supps = useSupplementsStore.getState().supplements;
    expect(supps).toHaveLength(2);
    expect(supps[0]?.priority).toBe(1); // sorted first
  });

  it('sets error and rethrows when add fails', async () => {
    mockCreateUserSupplement.mockRejectedValueOnce(new Error('Create failed'));

    await expect(
      useSupplementsStore.getState().addSupplement({ name: 'Bad' })
    ).rejects.toThrow('Create failed');

    expect(useSupplementsStore.getState().error).toBe('Create failed');
  });
});

// ---------------------------------------------------------------------------
// addFromRecommendation
// ---------------------------------------------------------------------------

describe('addFromRecommendation', () => {
  it('creates supplement from recommendation', async () => {
    const rec = {
      name: 'Creatine',
      dosage: '5g',
      timing: 'post_workout',
      frequency: 'daily',
      category: 'performance',
      tier: 'tier_1',
      priority: 1,
      evidence_level: 'high',
      evidence_sources: [],
      monthly_cost: 20,
      reason: 'Proven for strength',
    };
    const created = { id: 's-rec', name: 'Creatine', priority: 1 };
    mockCreateUserSupplement.mockResolvedValueOnce(created);

    await act(async () => {
      await useSupplementsStore.getState().addFromRecommendation(rec as never);
    });

    expect(useSupplementsStore.getState().supplements).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// updateSupplement / toggleActive
// ---------------------------------------------------------------------------

describe('updateSupplement', () => {
  it('updates supplement in list', async () => {
    useSupplementsStore.setState({
      supplements: [{ id: 's1', name: 'Vitamin D', priority: 1, is_active: true } as never],
    });
    const updated = { id: 's1', name: 'Vitamin D3', priority: 1, is_active: true };
    mockUpdateUserSupplement.mockResolvedValueOnce(updated);

    await act(async () => {
      await useSupplementsStore.getState().updateSupplement('s1', { name: 'Vitamin D3' });
    });

    expect(useSupplementsStore.getState().supplements[0]?.name).toBe('Vitamin D3');
  });

  it('sets error when update fails', async () => {
    mockUpdateUserSupplement.mockRejectedValueOnce(new Error('Update failed'));

    await expect(
      useSupplementsStore.getState().updateSupplement('s1', { name: 'Bad' })
    ).rejects.toThrow('Update failed');

    expect(useSupplementsStore.getState().error).toBe('Update failed');
  });
});

describe('toggleActive', () => {
  it('toggles supplement active state', async () => {
    useSupplementsStore.setState({
      supplements: [{ id: 's1', name: 'Iron', priority: 1, is_active: true } as never],
    });
    const updated = { id: 's1', name: 'Iron', priority: 1, is_active: false };
    mockUpdateUserSupplement.mockResolvedValueOnce(updated);

    await act(async () => {
      await useSupplementsStore.getState().toggleActive('s1', false);
    });

    expect(useSupplementsStore.getState().supplements[0]?.is_active).toBe(false);
  });

  it('sets error when toggle fails', async () => {
    mockUpdateUserSupplement.mockRejectedValueOnce(new Error('Toggle failed'));

    await act(async () => {
      await useSupplementsStore.getState().toggleActive('s1', false);
    });

    expect(useSupplementsStore.getState().error).toBe('Toggle failed');
  });
});

// ---------------------------------------------------------------------------
// removeSupplement
// ---------------------------------------------------------------------------

describe('removeSupplement', () => {
  it('removes supplement from list', async () => {
    useSupplementsStore.setState({
      supplements: [{ id: 's1', name: 'Iron', priority: 1 } as never],
    });
    mockDeleteUserSupplement.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useSupplementsStore.getState().removeSupplement('s1');
    });

    expect(useSupplementsStore.getState().supplements).toHaveLength(0);
  });

  it('sets error and rethrows when delete fails', async () => {
    mockDeleteUserSupplement.mockRejectedValueOnce(new Error('Delete failed'));

    await expect(
      useSupplementsStore.getState().removeSupplement('s1')
    ).rejects.toThrow('Delete failed');

    expect(useSupplementsStore.getState().error).toBe('Delete failed');
  });
});

// ---------------------------------------------------------------------------
// logTaken
// ---------------------------------------------------------------------------

describe('logTaken', () => {
  it('logs supplement taken and prepends to todayLogs', async () => {
    const log = { id: 'l-new', supplement_id: 's1', taken_at: new Date().toISOString() };
    mockLogSupplementTaken.mockResolvedValueOnce(log);

    await act(async () => {
      await useSupplementsStore.getState().logTaken('s1');
    });

    expect(useSupplementsStore.getState().todayLogs).toHaveLength(1);
    expect(useSupplementsStore.getState().todayLogs[0]?.supplement_id).toBe('s1');
  });

  it('sets error when log fails', async () => {
    mockLogSupplementTaken.mockRejectedValueOnce(new Error('Log failed'));

    await act(async () => {
      await useSupplementsStore.getState().logTaken('s1');
    });

    expect(useSupplementsStore.getState().error).toBe('Log failed');
  });
});

// ---------------------------------------------------------------------------
// setBudget
// ---------------------------------------------------------------------------

describe('setBudget', () => {
  it('updates budget in state', async () => {
    mockUpdateSupplementBudget.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useSupplementsStore.getState().setBudget(150);
    });

    expect(useSupplementsStore.getState().budget).toBe(150);
  });

  it('sets error when budget update fails', async () => {
    mockUpdateSupplementBudget.mockRejectedValueOnce(new Error('Budget failed'));

    await act(async () => {
      await useSupplementsStore.getState().setBudget(200);
    });

    expect(useSupplementsStore.getState().error).toBe('Budget failed');
  });
});
