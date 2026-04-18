// =============================================================================
// TRANSFORMR — useUpgradeModal
//
// Thin typed wrapper around `upgradeModalEvents.emit` so screens can trigger
// the global UpgradeModal without importing the raw emitter directly.
// =============================================================================

import { useCallback } from 'react';
import { upgradeModalEvents, FeatureKey } from './useFeatureGate';

interface ShowUpgradeModalOptions {
  featureKey: FeatureKey;
}

interface UseUpgradeModalResult {
  showUpgradeModal: (options: ShowUpgradeModalOptions) => void;
  hideUpgradeModal: () => void;
}

export function useUpgradeModal(): UseUpgradeModalResult {
  const showUpgradeModal = useCallback(({ featureKey }: ShowUpgradeModalOptions) => {
    upgradeModalEvents.emit(featureKey);
  }, []);

  // The existing UpgradeModal handles its own close state via internal animation.
  // hideUpgradeModal is provided for API symmetry only.
  const hideUpgradeModal = useCallback(() => {
    // No-op: modal self-manages dismissal.
  }, []);

  return { showUpgradeModal, hideUpgradeModal };
}
