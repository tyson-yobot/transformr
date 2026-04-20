import { useSettingsStore } from '../../stores/settingsStore';
import type { FitnessPreferences } from '../../stores/settingsStore';
import type { Profile } from '../../types/database';

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
// Helpers
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'update', 'insert', 'upsert'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

const INITIAL_STATE = {
  theme: 'dark' as const,
  voiceEnabled: false,
  narratorEnabled: false,
  briefingEnabled: true,
  lastBriefingDate: null,
  hasSeenDashboard: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
  useSettingsStore.setState(INITIAL_STATE);
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has correct default theme', () => {
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('has voice and narrator disabled by default', () => {
    expect(useSettingsStore.getState().voiceEnabled).toBe(false);
    expect(useSettingsStore.getState().narratorEnabled).toBe(false);
  });

  it('has briefing enabled by default', () => {
    expect(useSettingsStore.getState().briefingEnabled).toBe(true);
  });

  it('hasSeenDashboard is false by default', () => {
    expect(useSettingsStore.getState().hasSeenDashboard).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateSetting
// ---------------------------------------------------------------------------

describe('updateSetting', () => {
  it('updates theme to light', () => {
    useSettingsStore.getState().updateSetting('theme', 'light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('updates voiceEnabled to true (syncs to profile)', () => {
    useSettingsStore.getState().updateSetting('voiceEnabled', true);
    expect(useSettingsStore.getState().voiceEnabled).toBe(true);
    // syncToProfile is triggered — getUser should eventually be called
  });

  it('updates narratorEnabled', () => {
    useSettingsStore.getState().updateSetting('narratorEnabled', true);
    expect(useSettingsStore.getState().narratorEnabled).toBe(true);
  });

  it('updates briefingEnabled', () => {
    useSettingsStore.getState().updateSetting('briefingEnabled', false);
    expect(useSettingsStore.getState().briefingEnabled).toBe(false);
  });

  it('updates lastBriefingDate', () => {
    useSettingsStore.getState().updateSetting('lastBriefingDate', '2026-04-18');
    expect(useSettingsStore.getState().lastBriefingDate).toBe('2026-04-18');
  });
});

// ---------------------------------------------------------------------------
// setFitnessPrefs
// ---------------------------------------------------------------------------

describe('setFitnessPrefs', () => {
  it('partially updates fitness preferences', () => {
    const prefs: Partial<FitnessPreferences> = { workoutDaysPerWeek: 5 };
    useSettingsStore.getState().setFitnessPrefs(prefs);
    expect(useSettingsStore.getState().fitnessPreferences.workoutDaysPerWeek).toBe(5);
  });

  it('preserves existing fitness prefs when partially updating', () => {
    useSettingsStore.getState().setFitnessPrefs({ experienceLevel: 'advanced' });
    const prefs = useSettingsStore.getState().fitnessPreferences;
    expect(prefs.experienceLevel).toBe('advanced');
    // Other fields should remain
    expect(prefs.equipment).toBeDefined();
  });

  it('updates equipment list', () => {
    useSettingsStore.getState().setFitnessPrefs({ equipment: ['bodyweight'] });
    expect(useSettingsStore.getState().fitnessPreferences.equipment).toEqual(['bodyweight']);
  });
});

// ---------------------------------------------------------------------------
// markDashboardSeen
// ---------------------------------------------------------------------------

describe('markDashboardSeen', () => {
  it('sets hasSeenDashboard to true', () => {
    expect(useSettingsStore.getState().hasSeenDashboard).toBe(false);
    useSettingsStore.getState().markDashboardSeen();
    expect(useSettingsStore.getState().hasSeenDashboard).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// loadFromProfile
// ---------------------------------------------------------------------------

describe('loadFromProfile', () => {
  it('loads theme from profile', () => {
    const profile = { theme: 'light' } as unknown as Profile;
    useSettingsStore.getState().loadFromProfile(profile);
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('loads voice_commands_enabled from profile', () => {
    const profile = { voice_commands_enabled: true } as unknown as Profile;
    useSettingsStore.getState().loadFromProfile(profile);
    expect(useSettingsStore.getState().voiceEnabled).toBe(true);
  });

  it('loads narrator_enabled from profile', () => {
    const profile = { narrator_enabled: true } as unknown as Profile;
    useSettingsStore.getState().loadFromProfile(profile);
    expect(useSettingsStore.getState().narratorEnabled).toBe(true);
  });

  it('falls back to current state when profile field is null', () => {
    useSettingsStore.setState({ theme: 'light' as const });
    const profile = { theme: null, voice_commands_enabled: null, narrator_enabled: null } as unknown as Profile;
    useSettingsStore.getState().loadFromProfile(profile);
    // Should keep existing 'light' theme since null → fallback to current
    expect(useSettingsStore.getState().theme).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// syncToProfile
// ---------------------------------------------------------------------------

describe('syncToProfile', () => {
  it('syncs when a user is authenticated', async () => {
    await useSettingsStore.getState().syncToProfile();
    expect(mockGetUser).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('does nothing when no user is authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await useSettingsStore.getState().syncToProfile();
    // from() should not be called since there's no user
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('handles errors gracefully (silent catch)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));
    await expect(useSettingsStore.getState().syncToProfile()).resolves.toBeUndefined();
  });
});
