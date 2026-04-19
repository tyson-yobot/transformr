import { act } from '@testing-library/react-native';
import { useNutritionStore } from '../../stores/nutritionStore';

// ---------------------------------------------------------------------------
// Mocks
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

jest.mock('../../utils/storage', () => ({
  addToSyncQueue: jest.fn(),
  getSyncQueue: jest.fn().mockReturnValue([]),
  getStorageJSON: jest.fn().mockReturnValue(null),
  setStorageJSON: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'neq', 'gte', 'lte', 'lt', 'order', 'insert', 'update', 'delete', 'single', 'maybeSingle', 'in', 'limit', 'ilike', 'upsert'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useNutritionStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty todayLogs', () => {
    expect(useNutritionStore.getState().todayLogs).toHaveLength(0);
  });

  it('has empty waterLogs', () => {
    expect(useNutritionStore.getState().waterLogs).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useNutritionStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useNutritionStore.setState({ error: 'Oops' });
    useNutritionStore.getState().clearError();
    expect(useNutritionStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useNutritionStore.setState({ todayLogs: [{ id: '1' } as never], error: 'err' });
    useNutritionStore.getState().reset();
    expect(useNutritionStore.getState().todayLogs).toHaveLength(0);
    expect(useNutritionStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getTodayMacros
// ---------------------------------------------------------------------------

describe('getTodayMacros', () => {
  it('sums up macros from todayLogs', () => {
    useNutritionStore.setState({
      todayLogs: [
        { id: '1', calories: 500, protein: 40, carbs: 50, fat: 15 } as never,
        { id: '2', calories: 300, protein: 25, carbs: 30, fat: 10 } as never,
      ],
      waterLogs: [{ id: 'w1', amount_oz: 32 } as never, { id: 'w2', amount_oz: 16 } as never],
    });

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(800);
    expect(macros.protein).toBe(65);
    expect(macros.carbs).toBe(80);
    expect(macros.fat).toBe(25);
    expect(macros.water_oz).toBe(48);
  });

  it('returns zeros when no logs', () => {
    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(0);
    expect(macros.water_oz).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fetchTodayNutrition
// ---------------------------------------------------------------------------

describe('fetchTodayNutrition', () => {
  it('fetches nutrition logs and water logs', async () => {
    const nutritionLog = { id: 'nl-1', user_id: 'user-123', calories: 500, protein: 40, carbs: 50, fat: 15 };
    const waterLog = { id: 'wl-1', user_id: 'user-123', amount_oz: 32 };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: [nutritionLog], error: null }); // nutrition_logs
      if (callCount === 2) return makeChain({ data: [waterLog], error: null }); // water_logs
      return makeChain({ data: [], error: null }); // supplements / supplement_logs
    });

    await act(async () => {
      await useNutritionStore.getState().fetchTodayNutrition();
    });

    expect(useNutritionStore.getState().todayLogs).toHaveLength(1);
    expect(useNutritionStore.getState().waterLogs).toHaveLength(1);
    expect(useNutritionStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useNutritionStore.getState().fetchTodayNutrition();
    });

    expect(useNutritionStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// logFood
// ---------------------------------------------------------------------------

describe('logFood', () => {
  it('logs a food entry and adds to todayLogs', async () => {
    const newLog = { id: 'nl-new', user_id: 'user-123', calories: 400, protein: 30, carbs: 40, fat: 10 };
    mockFrom.mockReturnValue(makeChain({ data: newLog, error: null }));

    await act(async () => {
      await useNutritionStore.getState().logFood({
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 10,
        food_name: 'Chicken Breast',
      });
    });

    expect(useNutritionStore.getState().todayLogs).toHaveLength(1);
    expect(useNutritionStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useNutritionStore.getState().logFood({ calories: 100, protein: 10, carbs: 10, fat: 5 });
    });

    expect(useNutritionStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// logWater
// ---------------------------------------------------------------------------

describe('logWater', () => {
  it('logs water intake and adds to waterLogs', async () => {
    const waterLog = { id: 'wl-new', user_id: 'user-123', amount_oz: 16 };
    mockFrom.mockReturnValue(makeChain({ data: waterLog, error: null }));

    await act(async () => {
      await useNutritionStore.getState().logWater(16);
    });

    expect(useNutritionStore.getState().waterLogs).toHaveLength(1);
    expect(useNutritionStore.getState().waterLogs[0]?.amount_oz).toBe(16);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useNutritionStore.getState().logWater(8);
    });

    expect(useNutritionStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// deleteLog
// ---------------------------------------------------------------------------

describe('deleteLog', () => {
  it('removes a log entry from todayLogs', async () => {
    useNutritionStore.setState({ todayLogs: [{ id: 'nl-1' } as never] });
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useNutritionStore.getState().deleteLog('nl-1');
    });

    expect(useNutritionStore.getState().todayLogs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// searchFoods
// ---------------------------------------------------------------------------

describe('searchFoods', () => {
  it('searches foods and updates searchResults', async () => {
    const foods = [{ id: 'f1', name: 'Banana' }, { id: 'f2', name: 'Banana Bread' }];
    mockFrom.mockReturnValue(makeChain({ data: foods, error: null }));

    await act(async () => {
      await useNutritionStore.getState().searchFoods('banana');
    });

    expect(useNutritionStore.getState().searchResults).toHaveLength(2);
  });
});
