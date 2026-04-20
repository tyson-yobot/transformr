import { renderHook, act } from '@testing-library/react-native';
import { useUpgradeModal } from '../../hooks/useUpgradeModal';
import type { FeatureKey } from '../../hooks/useFeatureGate';

const mockEmit = jest.fn();

jest.mock('../../hooks/useFeatureGate', () => ({
  upgradeModalEvents: {
    emit: (...args: [FeatureKey]) => mockEmit(...args),
  },
}));

describe('useUpgradeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns showUpgradeModal and hideUpgradeModal functions', () => {
    const { result } = renderHook(() => useUpgradeModal());
    expect(typeof result.current.showUpgradeModal).toBe('function');
    expect(typeof result.current.hideUpgradeModal).toBe('function');
  });

  it('showUpgradeModal calls upgradeModalEvents.emit with the provided featureKey', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.showUpgradeModal({ featureKey: 'ai_chat_coach' });
    });

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('ai_chat_coach');
  });

  it('showUpgradeModal passes the exact featureKey to the emitter', () => {
    const { result } = renderHook(() => useUpgradeModal());
    const feature: FeatureKey = 'readiness_score';

    act(() => {
      result.current.showUpgradeModal({ featureKey: feature });
    });

    expect(mockEmit).toHaveBeenCalledWith(feature);
  });

  it('hideUpgradeModal does not throw (no-op)', () => {
    const { result } = renderHook(() => useUpgradeModal());
    expect(() => {
      act(() => {
        result.current.hideUpgradeModal();
      });
    }).not.toThrow();
  });

  it('hideUpgradeModal does not call the emitter', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.hideUpgradeModal();
    });

    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('showUpgradeModal can be called multiple times with different keys', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.showUpgradeModal({ featureKey: 'ai_chat_coach' });
      result.current.showUpgradeModal({ featureKey: 'ghost_mode' });
    });

    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'ai_chat_coach');
    expect(mockEmit).toHaveBeenNthCalledWith(2, 'ghost_mode');
  });
});
