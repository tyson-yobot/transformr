// =============================================================================
// TRANSFORMR -- Integration Tests: Nutrition Logging Flow
// =============================================================================

import { useNutritionStore } from '../../stores/nutritionStore';
import type { NutritionLog, WaterLog, SavedMeal, Food } from '../../types/database';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc-123' };

/** Chainable Supabase query builder mock. */
function createQueryChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const handler = () => chain;

  chain.select = jest.fn().mockImplementation(handler);
  chain.insert = jest.fn().mockImplementation(handler);
  chain.delete = jest.fn().mockImplementation(handler);
  chain.update = jest.fn().mockImplementation(handler);
  chain.eq = jest.fn().mockImplementation(handler);
  chain.neq = jest.fn().mockImplementation(handler);
  chain.gte = jest.fn().mockImplementation(handler);
  chain.lt = jest.fn().mockImplementation(handler);
  chain.ilike = jest.fn().mockImplementation(handler);
  chain.order = jest.fn().mockImplementation(handler);
  chain.limit = jest.fn().mockImplementation(handler);
  chain.single = jest.fn().mockResolvedValue(resolvedValue);

  // When the chain is awaited directly (no .single()), resolve via .then()
  (chain as unknown as { then: (resolve: (v: unknown) => void) => void }).then = (resolve: (v: unknown) => void) =>
    resolve(resolvedValue);

  return chain;
}

let mockFromHandlers: Record<string, ReturnType<typeof createQueryChain>>;

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
  },
  from: jest.fn((table: string) => {
    if (mockFromHandlers[table]) return mockFromHandlers[table];
    // Default: empty success
    return createQueryChain({ data: [], error: null });
  }),
};

jest.mock('../../services/supabase', () => ({
  supabase: mockFromHandlers ? undefined : undefined, // placeholder replaced below
}));

// Replace the mock implementation after we have the reference
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../../services/supabase');
  Object.defineProperty(mod, 'supabase', { value: mockSupabase, writable: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useNutritionStore.getState().reset();
}

function makeNutritionLog(overrides: Partial<NutritionLog> = {}): NutritionLog {
  return {
    id: `log-${Math.random().toString(36).slice(2, 8)}`,
    user_id: MOCK_USER.id,
    calories: 400,
    protein: 30,
    carbs: 40,
    fat: 15,
    meal_type: 'lunch',
    source: 'manual',
    logged_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeWaterLog(overrides: Partial<WaterLog> = {}): WaterLog {
  return {
    id: `water-${Math.random().toString(36).slice(2, 8)}`,
    user_id: MOCK_USER.id,
    amount_oz: 16,
    logged_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockFromHandlers = {};
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: MOCK_USER } });
  resetStore();
});

// =============================================================================
// 1. Logging a food item with macros
// =============================================================================

describe('logFood', () => {
  it('inserts a food log and appends it to todayLogs', async () => {
    const newLog = makeNutritionLog({
      id: 'log-001',
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
      meal_type: 'lunch',
      source: 'manual',
    });

    mockFromHandlers['nutrition_logs'] = createQueryChain({
      data: newLog,
      error: null,
    });

    await useNutritionStore.getState().logFood({
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
      meal_type: 'lunch',
    });

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(1);
    expect(state.todayLogs[0]).toEqual(newLog);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('passes correct insert payload to Supabase', async () => {
    const chain = createQueryChain({
      data: makeNutritionLog(),
      error: null,
    });
    mockFromHandlers['nutrition_logs'] = chain;

    await useNutritionStore.getState().logFood({
      food_id: 'food-xyz',
      calories: 300,
      protein: 25,
      carbs: 35,
      fat: 10,
      meal_type: 'breakfast',
      source: 'barcode',
      quantity: 1.5,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('nutrition_logs');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: MOCK_USER.id,
        food_id: 'food-xyz',
        calories: 300,
        protein: 25,
        carbs: 35,
        fat: 10,
        meal_type: 'breakfast',
        source: 'barcode',
        quantity: 1.5,
      }),
    );
  });

  it('defaults source to "manual" when not provided', async () => {
    const chain = createQueryChain({
      data: makeNutritionLog({ source: 'manual' }),
      error: null,
    });
    mockFromHandlers['nutrition_logs'] = chain;

    await useNutritionStore.getState().logFood({
      calories: 200,
      protein: 15,
      carbs: 20,
      fat: 8,
    });

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'manual' }),
    );
  });

  it('sets error when Supabase returns an error', async () => {
    mockFromHandlers['nutrition_logs'] = createQueryChain({
      data: null,
      error: { message: 'Insert failed' },
    });

    await useNutritionStore.getState().logFood({
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
    });

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(0);
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });

  it('sets error when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    await useNutritionStore.getState().logFood({
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
    });

    const state = useNutritionStore.getState();
    expect(state.error).toBe('Not authenticated');
    expect(state.isLoading).toBe(false);
  });
});

// =============================================================================
// 2. Daily nutrition summary calculation
// =============================================================================

describe('getTodayMacros (daily summary)', () => {
  it('returns zeroes when no logs exist', () => {
    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      water_oz: 0,
    });
  });

  it('sums macros from multiple food logs', async () => {
    const log1 = makeNutritionLog({ calories: 400, protein: 30, carbs: 40, fat: 10 });
    const log2 = makeNutritionLog({ calories: 600, protein: 50, carbs: 60, fat: 20 });

    // Directly set state for pure calculation testing
    useNutritionStore.setState({ todayLogs: [log1, log2] });

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(1000);
    expect(macros.protein).toBe(80);
    expect(macros.carbs).toBe(100);
    expect(macros.fat).toBe(30);
  });

  it('includes water total from water logs', () => {
    const water1 = makeWaterLog({ amount_oz: 16 });
    const water2 = makeWaterLog({ amount_oz: 8 });
    const water3 = makeWaterLog({ amount_oz: 24 });

    useNutritionStore.setState({ waterLogs: [water1, water2, water3] });

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.water_oz).toBe(48);
  });

  it('combines food macros and water in a single summary', () => {
    const log = makeNutritionLog({ calories: 500, protein: 40, carbs: 50, fat: 15 });
    const water = makeWaterLog({ amount_oz: 20 });

    useNutritionStore.setState({ todayLogs: [log], waterLogs: [water] });

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros).toEqual({
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
      water_oz: 20,
    });
  });

  it('accumulates across many meals correctly', () => {
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeNutritionLog({
        calories: 100 * (i + 1),
        protein: 10 * (i + 1),
        carbs: 15 * (i + 1),
        fat: 5 * (i + 1),
      }),
    );
    useNutritionStore.setState({ todayLogs: logs });

    const macros = useNutritionStore.getState().getTodayMacros();
    // sum 1..5 = 15
    expect(macros.calories).toBe(100 * 15);
    expect(macros.protein).toBe(10 * 15);
    expect(macros.carbs).toBe(15 * 15);
    expect(macros.fat).toBe(5 * 15);
  });
});

// =============================================================================
// 3. Water logging
// =============================================================================

describe('logWater', () => {
  it('inserts a water log and appends it to waterLogs', async () => {
    const newWater = makeWaterLog({ id: 'water-001', amount_oz: 16 });

    mockFromHandlers['water_logs'] = createQueryChain({
      data: newWater,
      error: null,
    });

    await useNutritionStore.getState().logWater(16);

    const state = useNutritionStore.getState();
    expect(state.waterLogs).toHaveLength(1);
    expect(state.waterLogs[0].amount_oz).toBe(16);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('passes correct insert payload to Supabase', async () => {
    const chain = createQueryChain({
      data: makeWaterLog({ amount_oz: 24 }),
      error: null,
    });
    mockFromHandlers['water_logs'] = chain;

    await useNutritionStore.getState().logWater(24);

    expect(mockSupabase.from).toHaveBeenCalledWith('water_logs');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: MOCK_USER.id,
        amount_oz: 24,
      }),
    );
  });

  it('accumulates multiple water logs in getTodayMacros', async () => {
    const water1 = makeWaterLog({ amount_oz: 8 });
    const water2 = makeWaterLog({ amount_oz: 12 });

    // First log
    mockFromHandlers['water_logs'] = createQueryChain({ data: water1, error: null });
    await useNutritionStore.getState().logWater(8);

    // Second log
    mockFromHandlers['water_logs'] = createQueryChain({ data: water2, error: null });
    await useNutritionStore.getState().logWater(12);

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.water_oz).toBe(20);
  });

  it('sets error when Supabase returns an error', async () => {
    mockFromHandlers['water_logs'] = createQueryChain({
      data: null,
      error: { message: 'Water insert failed' },
    });

    await useNutritionStore.getState().logWater(16);

    const state = useNutritionStore.getState();
    expect(state.waterLogs).toHaveLength(0);
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });

  it('sets error when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    await useNutritionStore.getState().logWater(16);

    const state = useNutritionStore.getState();
    expect(state.error).toBe('Not authenticated');
  });
});

// =============================================================================
// 4. Meal deletion (removing a log from todayLogs)
// =============================================================================

describe('meal deletion (todayLogs removal)', () => {
  it('removes a log from todayLogs when filtering by id', () => {
    const log1 = makeNutritionLog({ id: 'log-keep-1', calories: 300, protein: 20, carbs: 30, fat: 10 });
    const log2 = makeNutritionLog({ id: 'log-delete', calories: 500, protein: 40, carbs: 50, fat: 15 });
    const log3 = makeNutritionLog({ id: 'log-keep-2', calories: 200, protein: 15, carbs: 20, fat: 8 });

    useNutritionStore.setState({ todayLogs: [log1, log2, log3] });

    // Simulate deletion by filtering (matches how UI would update state)
    useNutritionStore.setState((state) => ({
      todayLogs: state.todayLogs.filter((l) => l.id !== 'log-delete'),
    }));

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(2);
    expect(state.todayLogs.find((l) => l.id === 'log-delete')).toBeUndefined();
  });

  it('updates macro totals after a log is removed', () => {
    const log1 = makeNutritionLog({ id: 'log-a', calories: 400, protein: 30, carbs: 40, fat: 12 });
    const log2 = makeNutritionLog({ id: 'log-b', calories: 600, protein: 50, carbs: 60, fat: 20 });

    useNutritionStore.setState({ todayLogs: [log1, log2] });

    // Before deletion
    let macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(1000);

    // Remove log-b
    useNutritionStore.setState((state) => ({
      todayLogs: state.todayLogs.filter((l) => l.id !== 'log-b'),
    }));

    macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(400);
    expect(macros.protein).toBe(30);
    expect(macros.carbs).toBe(40);
    expect(macros.fat).toBe(12);
  });

  it('results in zero totals when the only log is removed', () => {
    const log = makeNutritionLog({ id: 'only-log', calories: 350, protein: 28, carbs: 35, fat: 10 });

    useNutritionStore.setState({ todayLogs: [log] });

    useNutritionStore.setState((state) => ({
      todayLogs: state.todayLogs.filter((l) => l.id !== 'only-log'),
    }));

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(0);
    expect(macros.protein).toBe(0);
    expect(macros.carbs).toBe(0);
    expect(macros.fat).toBe(0);
  });

  it('does nothing when deleting a non-existent log id', () => {
    const log = makeNutritionLog({ id: 'existing-log' });

    useNutritionStore.setState({ todayLogs: [log] });

    useNutritionStore.setState((state) => ({
      todayLogs: state.todayLogs.filter((l) => l.id !== 'non-existent'),
    }));

    expect(useNutritionStore.getState().todayLogs).toHaveLength(1);
  });
});

// =============================================================================
// 5. Saved meals functionality
// =============================================================================

describe('saved meals (logging from a saved meal)', () => {
  const chickenRiceMeal: SavedMeal = {
    id: 'meal-001',
    user_id: MOCK_USER.id,
    name: 'Chicken & Rice Bowl',
    meal_type: 'lunch',
    total_calories: 520,
    total_protein: 48,
    total_carbs: 52,
    total_fat: 12,
  };

  it('logs a food entry from a saved meal with saved_meal_id', async () => {
    const newLog = makeNutritionLog({
      id: 'log-from-meal',
      saved_meal_id: chickenRiceMeal.id,
      calories: chickenRiceMeal.total_calories!,
      protein: chickenRiceMeal.total_protein!,
      carbs: chickenRiceMeal.total_carbs!,
      fat: chickenRiceMeal.total_fat!,
      meal_type: 'lunch',
      source: 'saved_meal',
    });

    mockFromHandlers['nutrition_logs'] = createQueryChain({
      data: newLog,
      error: null,
    });

    await useNutritionStore.getState().logFood({
      saved_meal_id: chickenRiceMeal.id,
      calories: chickenRiceMeal.total_calories!,
      protein: chickenRiceMeal.total_protein!,
      carbs: chickenRiceMeal.total_carbs!,
      fat: chickenRiceMeal.total_fat!,
      meal_type: 'lunch',
      source: 'saved_meal',
    });

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(1);
    expect(state.todayLogs[0].saved_meal_id).toBe('meal-001');
    expect(state.todayLogs[0].source).toBe('saved_meal');
    expect(state.todayLogs[0].calories).toBe(520);
  });

  it('includes saved meal macros in daily summary', async () => {
    // Pre-existing manual log
    const manualLog = makeNutritionLog({
      calories: 300,
      protein: 20,
      carbs: 30,
      fat: 10,
    });
    useNutritionStore.setState({ todayLogs: [manualLog] });

    const savedMealLog = makeNutritionLog({
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
      source: 'saved_meal',
    });

    mockFromHandlers['nutrition_logs'] = createQueryChain({
      data: savedMealLog,
      error: null,
    });

    await useNutritionStore.getState().logFood({
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
      source: 'saved_meal',
    });

    const macros = useNutritionStore.getState().getTodayMacros();
    expect(macros.calories).toBe(820);
    expect(macros.protein).toBe(68);
    expect(macros.carbs).toBe(82);
    expect(macros.fat).toBe(22);
  });

  it('logs the same saved meal multiple times', async () => {
    const log1 = makeNutritionLog({
      id: 'meal-log-1',
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
    });
    const log2 = makeNutritionLog({
      id: 'meal-log-2',
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
    });

    mockFromHandlers['nutrition_logs'] = createQueryChain({ data: log1, error: null });
    await useNutritionStore.getState().logFood({
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
    });

    mockFromHandlers['nutrition_logs'] = createQueryChain({ data: log2, error: null });
    await useNutritionStore.getState().logFood({
      saved_meal_id: chickenRiceMeal.id,
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 12,
    });

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(2);

    const macros = state.getTodayMacros();
    expect(macros.calories).toBe(1040);
    expect(macros.protein).toBe(96);
  });
});

// =============================================================================
// 6. fetchTodayNutrition
// =============================================================================

describe('fetchTodayNutrition', () => {
  it('populates todayLogs and waterLogs from Supabase', async () => {
    const logs = [
      makeNutritionLog({ calories: 400, protein: 30, carbs: 40, fat: 12 }),
      makeNutritionLog({ calories: 600, protein: 50, carbs: 60, fat: 20 }),
    ];
    const waters = [makeWaterLog({ amount_oz: 16 }), makeWaterLog({ amount_oz: 8 })];

    mockFromHandlers['nutrition_logs'] = createQueryChain({ data: logs, error: null });
    mockFromHandlers['water_logs'] = createQueryChain({ data: waters, error: null });
    mockFromHandlers['supplements'] = createQueryChain({ data: [], error: null });
    mockFromHandlers['supplement_logs'] = createQueryChain({ data: [], error: null });

    await useNutritionStore.getState().fetchTodayNutrition();

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toHaveLength(2);
    expect(state.waterLogs).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    mockFromHandlers['nutrition_logs'] = createQueryChain({
      data: null,
      error: { message: 'Fetch failed' },
    });
    mockFromHandlers['water_logs'] = createQueryChain({ data: [], error: null });
    mockFromHandlers['supplements'] = createQueryChain({ data: [], error: null });
    mockFromHandlers['supplement_logs'] = createQueryChain({ data: [], error: null });

    await useNutritionStore.getState().fetchTodayNutrition();

    const state = useNutritionStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });
});

// =============================================================================
// 7. searchFoods
// =============================================================================

describe('searchFoods', () => {
  it('populates searchResults from Supabase', async () => {
    const foods = [
      { id: 'f1', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_size: 100, serving_unit: 'g' },
      { id: 'f2', name: 'Chicken Thigh', calories: 209, protein: 26, carbs: 0, fat: 10.9, serving_size: 100, serving_unit: 'g' },
    ];

    mockFromHandlers['foods'] = createQueryChain({ data: foods, error: null });

    await useNutritionStore.getState().searchFoods('chicken');

    const state = useNutritionStore.getState();
    expect(state.searchResults).toHaveLength(2);
    expect(state.searchResults[0].name).toBe('Chicken Breast');
    expect(state.isLoading).toBe(false);
  });

  it('calls ilike with the correct search pattern', async () => {
    const chain = createQueryChain({ data: [], error: null });
    mockFromHandlers['foods'] = chain;

    await useNutritionStore.getState().searchFoods('oats');

    expect(mockSupabase.from).toHaveBeenCalledWith('foods');
    expect(chain.ilike).toHaveBeenCalledWith('name', '%oats%');
  });
});

// =============================================================================
// 8. Store reset
// =============================================================================

describe('reset', () => {
  it('clears all state back to initial values', () => {
    useNutritionStore.setState({
      todayLogs: [makeNutritionLog()],
      waterLogs: [makeWaterLog()],
      searchResults: [{ id: 'f1', name: 'Test', calories: 100, protein: 10, carbs: 10, fat: 5, serving_size: 100, serving_unit: 'g' } as Food],
      isLoading: true,
      error: 'some error',
    });

    useNutritionStore.getState().reset();

    const state = useNutritionStore.getState();
    expect(state.todayLogs).toEqual([]);
    expect(state.waterLogs).toEqual([]);
    expect(state.searchResults).toEqual([]);
    expect(state.supplements).toEqual([]);
    expect(state.supplementLogs).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

// =============================================================================
// 9. clearError
// =============================================================================

describe('clearError', () => {
  it('clears the error without affecting other state', () => {
    const log = makeNutritionLog();
    useNutritionStore.setState({
      todayLogs: [log],
      error: 'Something went wrong',
    });

    useNutritionStore.getState().clearError();

    const state = useNutritionStore.getState();
    expect(state.error).toBeNull();
    expect(state.todayLogs).toHaveLength(1);
  });
});
