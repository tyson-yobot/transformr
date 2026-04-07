// =============================================================================
// TRANSFORMR — Workout Logging Integration Tests
// =============================================================================

import { useWorkoutStore } from '../../stores/workoutStore';
import { detectPRs } from '../../services/calculations/prDetection';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockUser = { id: 'user-123', email: 'test@transformr.app' };

/** Builds a chainable query mock that resolves with the given payload. */
function chainable(resolvedValue: Record<string, unknown> = {}) {
  const obj: Record<string, jest.Mock> = {};
  const self = () => obj;
  obj.select = jest.fn().mockReturnValue(obj);
  obj.insert = jest.fn().mockReturnValue(obj);
  obj.update = jest.fn().mockReturnValue(obj);
  obj.delete = jest.fn().mockReturnValue(obj);
  obj.eq = jest.fn().mockReturnValue(obj);
  obj.or = jest.fn().mockReturnValue(obj);
  obj.not = jest.fn().mockReturnValue(obj);
  obj.ilike = jest.fn().mockReturnValue(obj);
  obj.order = jest.fn().mockReturnValue(obj);
  obj.limit = jest.fn().mockReturnValue(obj);
  obj.single = jest.fn().mockResolvedValue(resolvedValue);
  // When the chain is awaited directly (no terminal .single()) resolve here.
  obj.then = jest.fn((resolve) => resolve(resolvedValue));
  return obj;
}

const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123', email: 'test@transformr.app' } } }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('../../utils/haptics', () => ({
  hapticPR: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useWorkoutStore.getState().reset();
}

const SESSION_ID = 'session-abc';
const TEMPLATE_ID = 'template-push';

function fakeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    user_id: mockUser.id,
    template_id: TEMPLATE_ID,
    name: 'Workout',
    started_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ========================== Starting a workout =============================

describe('startWorkout', () => {
  it('creates a session and stores it as activeSession', async () => {
    const session = fakeSession();
    const chain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(chain);

    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);

    const state = useWorkoutStore.getState();
    expect(state.activeSession).toEqual(session);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('workout_sessions');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        template_id: TEMPLATE_ID,
        name: 'Workout',
      }),
    );
  });

  it('starts a free-form workout when templateId is null', async () => {
    const session = fakeSession({ template_id: null });
    const chain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(chain);

    await useWorkoutStore.getState().startWorkout(null);

    expect(useWorkoutStore.getState().activeSession).toEqual(session);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: null }),
    );
  });

  it('sets error when Supabase returns an error', async () => {
    const chain = chainable({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(chain);

    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);

    const state = useWorkoutStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });

  it('sets error when user is not authenticated', async () => {
    const { supabase } = require('../../services/supabase');
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);

    expect(useWorkoutStore.getState().error).toBe('Not authenticated');
    expect(useWorkoutStore.getState().activeSession).toBeNull();
  });
});

// ========================== Logging sets ===================================

describe('logSet', () => {
  beforeEach(async () => {
    // Pre-populate an active session so logSet has context.
    const session = fakeSession();
    const chain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(chain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();
  });

  it('inserts a set with correct weight, reps, and RPE', async () => {
    // First call: count query; second call: insert
    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 225,
      reps: 5,
      rpe: 8,
    });

    expect(useWorkoutStore.getState().error).toBeNull();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
    expect(mockFrom).toHaveBeenCalledWith('workout_sets');
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: SESSION_ID,
        exercise_id: 'exercise-bench',
        set_number: 1,
        weight: 225,
        reps: 5,
        rpe: 8,
      }),
    );
  });

  it('increments set_number based on existing sets', async () => {
    const countChain = chainable({ count: 3, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 225,
      reps: 5,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ set_number: 4 }),
    );
  });

  it('logs a warmup set with is_warmup flag', async () => {
    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 135,
      reps: 10,
      is_warmup: true,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_warmup: true }),
    );
  });

  it('logs a dropset with is_dropset flag', async () => {
    const countChain = chainable({ count: 2, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 185,
      reps: 12,
      is_dropset: true,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_dropset: true }),
    );
  });

  it('logs a set to failure with is_failure flag', async () => {
    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 205,
      reps: 8,
      is_failure: true,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_failure: true }),
    );
  });

  it('logs a timed set with duration_seconds', async () => {
    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-plank', {
      duration_seconds: 60,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ duration_seconds: 60 }),
    );
  });

  it('sets error when no active session exists', async () => {
    resetStore(); // clears activeSession

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 225,
      reps: 5,
    });

    expect(useWorkoutStore.getState().error).toBe('No active workout session');
  });

  it('sets error when count query fails', async () => {
    const countChain = chainable({ count: null, error: { message: 'count failed' } });
    mockFrom.mockReturnValue(countChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 225,
      reps: 5,
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('defaults boolean flags to false when not provided', async () => {
    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 200,
      reps: 6,
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_warmup: false,
        is_dropset: false,
        is_failure: false,
      }),
    );
  });
});

// ========================== Completing a workout ===========================

describe('completeWorkout', () => {
  beforeEach(async () => {
    // Start a session 45 minutes ago so duration calculation is meaningful.
    const startedAt = new Date(Date.now() - 45 * 60_000).toISOString();
    const session = fakeSession({ started_at: startedAt });
    const chain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(chain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();
  });

  it('updates the session with completed_at and duration_minutes', async () => {
    const updateChain = chainable({ error: null });
    mockFrom.mockReturnValue(updateChain);

    await useWorkoutStore.getState().completeWorkout();

    const state = useWorkoutStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('workout_sessions');
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: expect.any(String),
        duration_minutes: expect.any(Number),
      }),
    );
    expect(updateChain.eq).toHaveBeenCalledWith('id', SESSION_ID);
  });

  it('calculates duration_minutes approximately correctly', async () => {
    const updateChain = chainable({ error: null });
    mockFrom.mockReturnValue(updateChain);

    await useWorkoutStore.getState().completeWorkout();

    const updateCall = updateChain.update.mock.calls[0][0];
    // Session started 45 min ago, so duration should be around 45 (+/- 1 for execution).
    expect(updateCall.duration_minutes).toBeGreaterThanOrEqual(44);
    expect(updateCall.duration_minutes).toBeLessThanOrEqual(46);
  });

  it('sets error when no active session exists', async () => {
    resetStore();

    await useWorkoutStore.getState().completeWorkout();

    expect(useWorkoutStore.getState().error).toBe('No active workout session');
  });

  it('sets error when Supabase update fails', async () => {
    const updateChain = chainable({ error: { message: 'update failed' } });
    mockFrom.mockReturnValue(updateChain);

    await useWorkoutStore.getState().completeWorkout();

    expect(useWorkoutStore.getState().error).toBeTruthy();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });
});

// ========================== PR detection during logging ====================

describe('PR detection during workout logging', () => {
  const exerciseId = 'exercise-bench';

  it('detects a weight PR when new weight exceeds existing record', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 200 },
    ];
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const weightPR = prs.find((p) => p.recordType === 'max_weight');
    expect(weightPR).toBeDefined();
    expect(weightPR!.value).toBe(225);
    expect(weightPR!.previousRecord).toBe(200);
  });

  it('detects volume PR during a heavy set', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_volume', value: 1000 },
    ];
    // 225 * 8 = 1800 > 1000
    const prs = detectPRs({ exerciseId, weight: 225, reps: 8 }, existingPRs);
    const volPR = prs.find((p) => p.recordType === 'max_volume');
    expect(volPR).toBeDefined();
    expect(volPR!.value).toBe(1800);
  });

  it('detects estimated 1RM PR using Epley formula', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_1rm', value: 250 },
    ];
    // 225 * (1 + 5/30) = 262.5
    const prs = detectPRs({ exerciseId, weight: 225, reps: 5 }, existingPRs);
    const e1rmPR = prs.find((p) => p.recordType === 'max_1rm');
    expect(e1rmPR).toBeDefined();
    expect(e1rmPR!.value).toBeCloseTo(262.5, 0);
  });

  it('detects all four PR types when all are beaten', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 200 },
      { exerciseId, recordType: 'max_reps', value: 5 },
      { exerciseId, recordType: 'max_volume', value: 900 },
      { exerciseId, recordType: 'max_1rm', value: 220 },
    ];
    const prs = detectPRs({ exerciseId, weight: 225, reps: 8 }, existingPRs);
    expect(prs).toHaveLength(4);
  });

  it('does not flag PRs when values are below existing records', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_weight', value: 300 },
      { exerciseId, recordType: 'max_reps', value: 20 },
      { exerciseId, recordType: 'max_volume', value: 5000 },
      { exerciseId, recordType: 'max_1rm', value: 400 },
    ];
    const prs = detectPRs({ exerciseId, weight: 200, reps: 8 }, existingPRs);
    expect(prs).toHaveLength(0);
  });

  it('treats first-ever set as PRs for all record types', () => {
    const prs = detectPRs({ exerciseId, weight: 135, reps: 10 }, []);
    expect(prs.find((p) => p.recordType === 'max_weight')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_reps')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_volume')).toBeDefined();
    expect(prs.find((p) => p.recordType === 'max_1rm')).toBeDefined();
    expect(prs[0]!.previousRecord).toBeNull();
  });

  it('skips 1RM detection when reps exceed 12', () => {
    const prs = detectPRs({ exerciseId, weight: 100, reps: 15 }, []);
    expect(prs.find((p) => p.recordType === 'max_1rm')).toBeUndefined();
  });

  it('detects duration PR for timed exercises', () => {
    const existingPRs = [
      { exerciseId, recordType: 'max_duration', value: 60 },
    ];
    const prs = detectPRs(
      { exerciseId, weight: 0, reps: 0, durationSeconds: 90 },
      existingPRs,
    );
    const durPR = prs.find((p) => p.recordType === 'max_duration');
    expect(durPR).toBeDefined();
    expect(durPR!.value).toBe(90);
  });
});

// ========================== Offline queue behavior =========================

describe('offline queue behavior', () => {
  it('stores error state when logSet fails due to network error', async () => {
    // Seed an active session
    const session = fakeSession();
    const startChain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(startChain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();

    // Simulate a network failure on the count query
    const failChain = chainable({ count: null, error: { message: 'Network request failed' } });
    mockFrom.mockReturnValue(failChain);

    await useWorkoutStore.getState().logSet('exercise-bench', {
      weight: 225,
      reps: 5,
    });

    const state = useWorkoutStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
    // The active session should remain so the user can retry
    expect(state.activeSession).not.toBeNull();
  });

  it('preserves active session when completeWorkout fails', async () => {
    // Seed an active session
    const session = fakeSession();
    const startChain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(startChain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();

    // Simulate network failure on update
    const failChain = chainable({ error: { message: 'Network request failed' } });
    mockFrom.mockReturnValue(failChain);

    await useWorkoutStore.getState().completeWorkout();

    const state = useWorkoutStore.getState();
    expect(state.error).toBeTruthy();
    // Session should NOT be cleared so the user can retry
    expect(state.activeSession).not.toBeNull();
    expect(state.activeSession!.id).toBe(SESSION_ID);
  });

  it('can retry logSet after a transient failure', async () => {
    // Seed an active session
    const session = fakeSession();
    const startChain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(startChain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();

    // First attempt fails
    const failChain = chainable({ count: null, error: { message: 'timeout' } });
    mockFrom.mockReturnValue(failChain);
    await useWorkoutStore.getState().logSet('exercise-bench', { weight: 225, reps: 5 });
    expect(useWorkoutStore.getState().error).toBeTruthy();

    // Clear error and retry
    useWorkoutStore.getState().clearError();
    expect(useWorkoutStore.getState().error).toBeNull();

    const countChain = chainable({ count: 0, error: null });
    const insertChain = chainable({ error: null });
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(insertChain);

    await useWorkoutStore.getState().logSet('exercise-bench', { weight: 225, reps: 5 });

    expect(useWorkoutStore.getState().error).toBeNull();
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ weight: 225, reps: 5 }),
    );
  });

  it('can retry completeWorkout after a transient failure', async () => {
    // Seed session
    const session = fakeSession();
    const startChain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(startChain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    jest.clearAllMocks();

    // First attempt fails
    const failChain = chainable({ error: { message: 'timeout' } });
    mockFrom.mockReturnValue(failChain);
    await useWorkoutStore.getState().completeWorkout();
    expect(useWorkoutStore.getState().error).toBeTruthy();
    expect(useWorkoutStore.getState().activeSession).not.toBeNull();

    // Clear error and retry
    useWorkoutStore.getState().clearError();

    const successChain = chainable({ error: null });
    mockFrom.mockReturnValue(successChain);
    await useWorkoutStore.getState().completeWorkout();

    expect(useWorkoutStore.getState().error).toBeNull();
    expect(useWorkoutStore.getState().activeSession).toBeNull();
  });
});

// ========================== Full workout flow ==============================

describe('full workout flow (end-to-end)', () => {
  it('runs a complete session: start, log sets, complete', async () => {
    // 1. Start workout
    const session = fakeSession({ started_at: new Date(Date.now() - 30 * 60_000).toISOString() });
    const startChain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(startChain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    expect(useWorkoutStore.getState().activeSession).toBeDefined();

    // 2. Log 3 working sets of bench press
    for (let i = 0; i < 3; i++) {
      const countChain = chainable({ count: i, error: null });
      const insertChain = chainable({ error: null });
      mockFrom
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(insertChain);

      await useWorkoutStore.getState().logSet('exercise-bench', {
        weight: 225,
        reps: 5,
        rpe: 8,
      });

      expect(useWorkoutStore.getState().error).toBeNull();
    }

    // 3. Complete workout
    const updateChain = chainable({ error: null });
    mockFrom.mockReturnValue(updateChain);
    await useWorkoutStore.getState().completeWorkout();

    const finalState = useWorkoutStore.getState();
    expect(finalState.activeSession).toBeNull();
    expect(finalState.error).toBeNull();
    expect(finalState.isLoading).toBe(false);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: expect.any(String),
        duration_minutes: expect.any(Number),
      }),
    );
  });
});

// ========================== Store reset ====================================

describe('reset', () => {
  it('clears all state back to initial values', async () => {
    // Populate some state first
    const session = fakeSession();
    const chain = chainable({ data: session, error: null });
    mockFrom.mockReturnValue(chain);
    await useWorkoutStore.getState().startWorkout(TEMPLATE_ID);
    expect(useWorkoutStore.getState().activeSession).not.toBeNull();

    useWorkoutStore.getState().reset();

    const state = useWorkoutStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.templates).toEqual([]);
    expect(state.exercises).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ========================== Ghost data =====================================

describe('getGhostData', () => {
  it('returns ghost sets from the most recent completed session', async () => {
    const ghostRows = [
      { exercise_id: 'ex-1', set_number: 1, weight: 200, reps: 5, workout_sessions: {} },
      { exercise_id: 'ex-1', set_number: 2, weight: 205, reps: 4, workout_sessions: {} },
    ];
    const ghostChain = chainable({ data: ghostRows, error: null });
    mockFrom.mockReturnValue(ghostChain);

    const result = await useWorkoutStore.getState().getGhostData('ex-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({ exercise_id: 'ex-1', set_number: 1, weight: 200, reps: 5 }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ exercise_id: 'ex-1', set_number: 2, weight: 205, reps: 4 }),
    );
    expect(mockFrom).toHaveBeenCalledWith('workout_sets');
  });

  it('returns empty array when user is not authenticated', async () => {
    const { supabase } = require('../../services/supabase');
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await useWorkoutStore.getState().getGhostData('ex-1');
    expect(result).toEqual([]);
  });

  it('returns empty array when query fails', async () => {
    const ghostChain = chainable({ data: null, error: { message: 'query failed' } });
    mockFrom.mockReturnValue(ghostChain);

    const result = await useWorkoutStore.getState().getGhostData('ex-1');
    expect(result).toEqual([]);
  });
});
