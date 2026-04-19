import { verifyDailyTasks } from '../../services/calculations/challengeVerification';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockStorageList = jest.fn();
const mockStorageFrom = jest.fn().mockReturnValue({ list: mockStorageList });
const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Chain builder
// ---------------------------------------------------------------------------

type QueryResult = { data: unknown; error: null };

function makeChain(result: QueryResult) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'neq', 'gte', 'lte', 'order', 'limit', 'single', 'maybeSingle'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: QueryResult) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = 'user-abc';
const DATE = '2026-04-18';

function task(id: string, type: string, config: Record<string, unknown> = {}) {
  return { id, type, config };
}

// ---------------------------------------------------------------------------
// verifyWorkout
// ---------------------------------------------------------------------------

describe('verifyWorkout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies a qualifying workout session', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ id: '1', duration_minutes: 60, location_type: 'gym' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'workout')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(1);
    expect(results['t1']?.unit).toBe('workouts');
  });

  it('returns not verified when no sessions logged', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'workout')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(0);
  });

  it('verifies with custom min_count and min_duration_minutes', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [
          { id: '1', duration_minutes: 30, location_type: 'gym' },
          { id: '2', duration_minutes: 30, location_type: 'gym' },
        ],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'workout', { min_duration_minutes: 30, min_count: 2 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(2);
  });

  it('verifies outdoor when require_outdoor is true and outdoor session exists', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [{ id: '1', duration_minutes: 60, location_type: 'outdoor' }],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'workout', { require_outdoor: true }),
    ]);
    expect(results['t1']?.verified).toBe(true);
  });

  it('fails when require_outdoor is true but all sessions are indoor', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [{ id: '1', duration_minutes: 60, location_type: 'gym' }],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'workout', { require_outdoor: true }),
    ]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('handles null data from supabase gracefully', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'workout')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// verifyWater
// ---------------------------------------------------------------------------

describe('verifyWater', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when total water meets the minimum', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ amount_oz: 64 }, { amount_oz: 64 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'water')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(128);
    expect(results['t1']?.unit).toBe('oz');
  });

  it('fails when total water is below minimum', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ amount_oz: 50 }], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'water')]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('uses custom min_oz from config', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ amount_oz: 60 }], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'water', { min_oz: 60 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(60);
  });

  it('handles logs with missing amount_oz', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ amount_oz: undefined }], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'water')]);
    expect(results['t1']?.currentValue).toBe(0);
    expect(results['t1']?.verified).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyNutrition
// ---------------------------------------------------------------------------

describe('verifyNutrition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when calories and protein are within targets', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ calories: 500, protein: 40 }, { calories: 700, protein: 50 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'nutrition', { max_calories: 2000, min_protein_g: 80 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(1200);
    expect(results['t1']?.unit).toBe('cal');
  });

  it('fails when calories exceed max', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ calories: 2500, protein: 100 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'nutrition', { max_calories: 2000 }),
    ]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('fails when protein is below minimum', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ calories: 1800, protein: 50 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'nutrition', { min_protein_g: 150 }),
    ]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('fails when no meals were logged', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'nutrition')]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('verifies when no calorie or protein config specified', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ calories: 3000, protein: 200 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'nutrition')]);
    // No max_calories or min_protein — only "has at least one meal" check
    expect(results['t1']?.verified).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyReading
// ---------------------------------------------------------------------------

describe('verifyReading', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when reading minutes produce enough estimated pages', async () => {
    // 20 min / 2 min per page = 10 pages ≥ 10
    mockFrom.mockReturnValue(
      makeChain({ data: [{ duration_minutes: 20, category: 'reading' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'reading')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(10);
    expect(results['t1']?.unit).toBe('pages');
  });

  it('fails when reading time is insufficient', async () => {
    // 10 min = 5 estimated pages < 10 default
    mockFrom.mockReturnValue(
      makeChain({ data: [{ duration_minutes: 10, category: 'reading' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'reading')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(5);
  });

  it('uses custom min_pages from config', async () => {
    // 30 min = 15 pages ≥ custom 5 pages
    mockFrom.mockReturnValue(
      makeChain({ data: [{ duration_minutes: 30, category: 'reading' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'reading', { min_pages: 5 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// verifyProgressPhoto
// ---------------------------------------------------------------------------

describe('verifyProgressPhoto', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when a progress photo exists', async () => {
    mockStorageList.mockResolvedValue({ data: [{ name: 'photo.jpg' }], error: null });
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'photo')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(1);
    expect(results['t1']?.unit).toBe('photo');
  });

  it('fails when no progress photo exists', async () => {
    mockStorageList.mockResolvedValue({ data: [], error: null });
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'photo')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(0);
  });

  it('handles null storage data gracefully', async () => {
    mockStorageList.mockResolvedValue({ data: null, error: null });
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'photo')]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('calls storage.from with the correct bucket name', async () => {
    mockStorageList.mockResolvedValue({ data: [], error: null });
    await verifyDailyTasks(USER_ID, DATE, [task('t1', 'photo')]);
    expect(mockStorageFrom).toHaveBeenCalledWith('progress-photos');
    expect(mockStorageList).toHaveBeenCalledWith(`${USER_ID}/${DATE}`);
  });
});

// ---------------------------------------------------------------------------
// verifyMeditation
// ---------------------------------------------------------------------------

describe('verifyMeditation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when meditation minutes meet the minimum', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ duration_minutes: 10 }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'meditation')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(10);
    expect(results['t1']?.unit).toBe('min');
  });

  it('fails when meditation time is below default minimum (5 min)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ duration_minutes: 3 }], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'meditation')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.targetValue).toBe(5);
  });

  it('uses custom min_minutes from config', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [{ duration_minutes: 20 }], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'meditation', { min_minutes: 20 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// verifySteps
// ---------------------------------------------------------------------------

describe('verifySteps', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when step count meets the minimum', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { data: { steps: 12000 } }, error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'steps')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(12000);
    expect(results['t1']?.unit).toBe('steps');
  });

  it('fails when step count is below minimum', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { data: { steps: 5000 } }, error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'steps')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.targetValue).toBe(10000);
  });

  it('uses custom min_steps from config', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { data: { steps: 8000 } }, error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'steps', { min_steps: 7500 }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(7500);
  });

  it('returns 0 steps when no checkin exists', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'steps')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(0);
  });

  it('returns 0 steps when checkin has no steps field', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: { data: { mood: 8 } }, error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'steps')]);
    expect(results['t1']?.currentValue).toBe(0);
    expect(results['t1']?.verified).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyAlcoholFree
// ---------------------------------------------------------------------------

describe('verifyAlcoholFree', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies a clean alcohol-free day', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ food_name: 'Chicken breast', notes: 'grilled' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'alcohol_free')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(0);
    expect(results['t1']?.unit).toBe('drinks');
  });

  it('fails when beer is logged', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ food_name: 'Beer', notes: '' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'alcohol_free')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(1);
  });

  it('fails when alcohol keyword appears in notes', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ food_name: 'Drink', notes: 'had some wine' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'alcohol_free')]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('catches keywords case-insensitively', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [{ food_name: 'WHISKEY sour', notes: '' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'alcohol_free')]);
    expect(results['t1']?.verified).toBe(false);
  });

  it('verifies when no nutrition logs exist', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'alcohol_free')]);
    expect(results['t1']?.verified).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyFasting
// ---------------------------------------------------------------------------

describe('verifyFasting', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies when no food is logged (full fast day)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'fasting')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(24);
    expect(results['t1']?.unit).toBe('hours fasted');
  });

  it('verifies when eating window is within 16:8 protocol', async () => {
    // First meal at 12:00, last meal at 19:00 → 7 hour window ≤ 8 hour window
    mockFrom.mockReturnValue(
      makeChain({
        data: [
          { logged_at: `${DATE}T12:00:00` },
          { logged_at: `${DATE}T19:00:00` },
        ],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'fasting', { protocol: '16:8' }),
    ]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(16);
  });

  it('fails when eating window exceeds allowed window', async () => {
    // 6 hour window but only 2 hour eating window allowed (22:2 protocol)
    mockFrom.mockReturnValue(
      makeChain({
        data: [
          { logged_at: `${DATE}T08:00:00` },
          { logged_at: `${DATE}T20:00:00` },
        ],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('t1', 'fasting', { protocol: '22:2' }),
    ]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.targetValue).toBe(22);
  });

  it('uses default 16:8 protocol when config is absent', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [
          { logged_at: `${DATE}T12:00:00` },
          { logged_at: `${DATE}T18:00:00` },
        ],
        error: null,
      })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'fasting')]);
    // 6 hour window ≤ 8 hour allowed → verified
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.targetValue).toBe(16);
  });

  it('handles single log entry (first === last)', async () => {
    // Single log — first and last are the same entry → 0ms window → always verified
    mockFrom.mockReturnValue(
      makeChain({ data: [{ logged_at: `${DATE}T14:00:00` }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'fasting')]);
    expect(results['t1']?.verified).toBe(true);
  });

  it('handles null logs data (treats as full fast)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'fasting')]);
    expect(results['t1']?.verified).toBe(true);
    expect(results['t1']?.currentValue).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// Default / unknown task type
// ---------------------------------------------------------------------------

describe('unknown task type (default case)', () => {
  it('returns unverified result with unit "completion"', async () => {
    const results = await verifyDailyTasks(USER_ID, DATE, [task('t1', 'custom_manual_task')]);
    expect(results['t1']?.verified).toBe(false);
    expect(results['t1']?.currentValue).toBe(0);
    expect(results['t1']?.targetValue).toBe(1);
    expect(results['t1']?.unit).toBe('completion');
  });
});

// ---------------------------------------------------------------------------
// verifyDailyTasks — multi-task dispatch
// ---------------------------------------------------------------------------

describe('verifyDailyTasks multi-task dispatch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('processes multiple tasks in one call', async () => {
    // Two tasks: one workout (verified), one unknown (not verified)
    mockFrom.mockReturnValue(
      makeChain({ data: [{ id: '1', duration_minutes: 60, location_type: 'gym' }], error: null })
    );
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('workout-task', 'workout'),
      task('manual-task', 'custom'),
    ]);
    expect(results['workout-task']?.verified).toBe(true);
    expect(results['manual-task']?.verified).toBe(false);
  });

  it('returns empty object for empty task list', async () => {
    const results = await verifyDailyTasks(USER_ID, DATE, []);
    expect(results).toEqual({});
  });

  it('keys results by task id', async () => {
    const results = await verifyDailyTasks(USER_ID, DATE, [
      task('id-alpha', 'custom'),
      task('id-beta', 'custom'),
    ]);
    expect(Object.keys(results)).toContain('id-alpha');
    expect(Object.keys(results)).toContain('id-beta');
  });
});
