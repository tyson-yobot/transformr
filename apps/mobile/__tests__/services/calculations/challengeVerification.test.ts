// ---------------------------------------------------------------------------
// Mocks — before import
// ---------------------------------------------------------------------------

const mockFrom = jest.fn();
const mockStorage = { from: jest.fn() };

jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: mockStorage,
  },
}));

import { verifyDailyTasks } from '../../../services/calculations/challengeVerification';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'order', 'maybeSingle', 'filter'];
  for (const m of methods) {
    chain[m] = jest.fn(() => chain);
  }
  chain['then'] = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(resolveValue));
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const USER_ID = 'u-1';
const DATE = '2026-04-19';

describe('verifyDailyTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.from.mockReturnValue({ list: jest.fn().mockResolvedValue({ data: [], error: null }) });
  });

  it('returns empty object for empty tasks array', async () => {
    const result = await verifyDailyTasks(USER_ID, DATE, []);
    expect(result).toEqual({});
  });

  it('returns verified=false for unknown task type', async () => {
    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 't1', type: 'custom_unknown', config: {} },
    ]);
    expect(result['t1']?.verified).toBe(false);
    expect(result['t1']?.taskId).toBe('t1');
  });

  it('verifies workout task — passes when session found', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ id: 's1', duration_minutes: 60, location_type: 'gym' }],
      error: null,
    }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'w1', type: 'workout', config: { min_duration_minutes: 45, min_count: 1 } },
    ]);
    expect(result['w1']?.verified).toBe(true);
    expect(result['w1']?.currentValue).toBeGreaterThanOrEqual(1);
  });

  it('verifies workout task — fails when no sessions', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'w1', type: 'workout', config: { min_count: 1 } },
    ]);
    expect(result['w1']?.verified).toBe(false);
  });

  it('verifies water task — passes when oz meets target', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ amount_oz: 64 }, { amount_oz: 70 }],
      error: null,
    }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'h2o', type: 'water', config: { min_oz: 128 } },
    ]);
    expect(result['h2o']?.verified).toBe(true);
    expect(result['h2o']?.currentValue).toBe(134);
  });

  it('verifies water task — fails when oz below target', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ amount_oz: 50 }],
      error: null,
    }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'h2o', type: 'water', config: { min_oz: 128 } },
    ]);
    expect(result['h2o']?.verified).toBe(false);
  });

  it('verifies alcohol_free task — passes when no alcohol logged', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ food_name: 'Chicken breast', notes: '' }],
      error: null,
    }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'af', type: 'alcohol_free', config: {} },
    ]);
    expect(result['af']?.verified).toBe(true);
  });

  it('verifies alcohol_free task — fails when alcohol logged', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ food_name: 'Beer', notes: '' }],
      error: null,
    }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 'af', type: 'alcohol_free', config: {} },
    ]);
    expect(result['af']?.verified).toBe(false);
  });

  it('handles multiple tasks of different types', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [{ duration_minutes: 60, location_type: 'gym' }], error: null }))
      .mockReturnValueOnce(makeChain({ data: [{ amount_oz: 130 }], error: null }));

    const result = await verifyDailyTasks(USER_ID, DATE, [
      { id: 't1', type: 'workout', config: {} },
      { id: 't2', type: 'water', config: { min_oz: 128 } },
    ]);
    expect(result['t1']).toBeDefined();
    expect(result['t2']).toBeDefined();
  });
});
