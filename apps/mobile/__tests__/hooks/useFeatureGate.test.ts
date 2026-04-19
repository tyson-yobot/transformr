import { renderHook } from '@testing-library/react-native';
import { useFeatureGate, useFeatureGates, hasAccess, getFeatureRequiredTier } from '../../hooks/useFeatureGate';
import type { SubscriptionTier } from '../../stores/subscriptionStore';

let mockTier: SubscriptionTier = 'free';

jest.mock('../../stores/subscriptionStore', () => ({
  useSubscriptionStore: jest.fn(),
  SubscriptionTier: { free: 'free', pro: 'pro', elite: 'elite', partners: 'partners' },
}));

import { useSubscriptionStore } from '../../stores/subscriptionStore';

const mockedUseSubscriptionStore = useSubscriptionStore as jest.MockedFunction<typeof useSubscriptionStore>;

interface MockSubscriptionState {
  tier: SubscriptionTier;
  usage: { aiMealCameraScans: number; aiChatMessages: number; lastResetDate: string };
  incrementUsage: jest.Mock;
}

function buildSubscriptionState(): MockSubscriptionState {
  return {
    tier: mockTier,
    usage: { aiMealCameraScans: 0, aiChatMessages: 0, lastResetDate: '2026-04-18' },
    incrementUsage: jest.fn(),
  };
}

function setupMocks() {
  const state = buildSubscriptionState();
  mockedUseSubscriptionStore.mockImplementation(
    (selector?: (s: MockSubscriptionState) => unknown) =>
      selector ? selector(state) : state,
  );
}

describe('hasAccess (standalone helper)', () => {
  it('returns true for a free feature regardless of tier', () => {
    expect(hasAccess('free', 'workout_logging')).toBe(true);
  });

  it('returns false for a pro feature when tier is free', () => {
    expect(hasAccess('free', 'ai_chat_coach')).toBe(false);
  });

  it('returns true for a pro feature when tier is pro', () => {
    expect(hasAccess('pro', 'ai_chat_coach')).toBe(true);
  });

  it('returns true for a pro feature when tier is elite', () => {
    expect(hasAccess('elite', 'ai_chat_coach')).toBe(true);
  });

  it('returns true for an elite feature when tier is partners (partners implies all)', () => {
    expect(hasAccess('partners', 'ai_trajectory_simulator_v2')).toBe(true);
  });

  it('returns false for an elite feature when tier is pro', () => {
    expect(hasAccess('pro', 'ai_trajectory_simulator_v2')).toBe(false);
  });
});

describe('getFeatureRequiredTier (standalone helper)', () => {
  it('returns "free" for workout_logging', () => {
    expect(getFeatureRequiredTier('workout_logging')).toBe('free');
  });

  it('returns "pro" or "elite" (not "free") for ai_chat_coach', () => {
    const tier = getFeatureRequiredTier('ai_chat_coach');
    expect(tier).not.toBe('free');
    expect(['pro', 'elite', 'partners']).toContain(tier);
  });

  it('returns "elite" for ai_trajectory_simulator_v2', () => {
    expect(getFeatureRequiredTier('ai_trajectory_simulator_v2')).toBe('elite');
  });

  it('returns "partners" for partner_linking', () => {
    expect(getFeatureRequiredTier('partner_linking')).toBe('partners');
  });
});

describe('useFeatureGate (hook)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTier = 'free';
    setupMocks();
  });

  it('isAvailable is true for a free feature on a free user', () => {
    const { result } = renderHook(() => useFeatureGate('workout_logging'));
    expect(result.current.isAvailable).toBe(true);
  });

  it('isAvailable is false for ai_chat_coach on a free user', () => {
    const { result } = renderHook(() => useFeatureGate('ai_chat_coach'));
    expect(result.current.isAvailable).toBe(false);
  });

  it('isAvailable is true for ai_chat_coach on a pro user', () => {
    mockTier = 'pro';
    setupMocks();
    const { result } = renderHook(() => useFeatureGate('ai_chat_coach'));
    expect(result.current.isAvailable).toBe(true);
  });

  it('exposes requiredTier matching the gate definition', () => {
    const { result } = renderHook(() => useFeatureGate('ai_chat_coach'));
    expect(result.current.requiredTier).toBe('pro');
  });

  it('provides a callable showUpgradeModal function', () => {
    const { result } = renderHook(() => useFeatureGate('ai_chat_coach'));
    expect(() => result.current.showUpgradeModal()).not.toThrow();
  });

  it('checkAndPrompt returns true when feature is available', () => {
    const { result } = renderHook(() => useFeatureGate('workout_logging'));
    expect(result.current.checkAndPrompt()).toBe(true);
  });

  it('checkAndPrompt returns false when feature is not available', () => {
    const { result } = renderHook(() => useFeatureGate('ai_chat_coach'));
    expect(result.current.checkAndPrompt()).toBe(false);
  });
});

describe('useFeatureGates (multi-feature hook)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTier = 'free';
    setupMocks();
  });

  it('returns correct boolean map for free tier', () => {
    const { result } = renderHook(() =>
      useFeatureGates(['workout_logging', 'ai_chat_coach']),
    );
    expect(result.current['workout_logging']).toBe(true);
    expect(result.current['ai_chat_coach']).toBe(false);
  });

  it('returns true for all pro features when tier is pro', () => {
    mockTier = 'pro';
    setupMocks();
    const { result } = renderHook(() =>
      useFeatureGates(['workout_logging', 'ai_chat_coach', 'ai_insights']),
    );
    expect(result.current['workout_logging']).toBe(true);
    expect(result.current['ai_chat_coach']).toBe(true);
    expect(result.current['ai_insights']).toBe(true);
  });

  it('returns a map with an entry for every requested feature', () => {
    const features: ['workout_logging', 'ai_chat_coach'] = ['workout_logging', 'ai_chat_coach'];
    const { result } = renderHook(() => useFeatureGates(features));
    for (const feature of features) {
      expect(Object.prototype.hasOwnProperty.call(result.current, feature)).toBe(true);
    }
  });
});
