// apps/mobile/constants/haptics.ts
// =============================================================================
// TRANSFORMR -- Centralized Haptic Language
// Typed triggerHaptic() wrapper around utils/haptics.ts.
// All Living Interface System components call this — never expo-haptics directly.
// Enables future global haptic-disable via a single flag check here.
// =============================================================================

import {
  hapticSelection,
  hapticMedium,
  hapticAchievement,
  hapticSuccess,
  hapticWarning,
  hapticError,
} from '@utils/haptics';

export type HapticType =
  | 'selection'     // tab tap, chip select, toggle, dropdown, calendar date
  | 'confirmation'  // primary CTA, set logged, meal logged, water +, habit check, save
  | 'achievement'   // PR, streak milestone, goal sealed, badge unlocked
  | 'success'       // workout complete, all daily goals met, sync complete
  | 'warning'       // streak at risk, missed goal, sync failed
  | 'error';        // auth failure, validation error, network timeout

/**
 * Trigger a haptic feedback event using the TRANSFORMR haptic vocabulary.
 * All Living Interface System components must call this instead of expo-haptics directly.
 *
 * @param type - Semantic haptic type
 * @param enabled - Pass false to skip (e.g. from a user preference flag). Default: true.
 */
export async function triggerHaptic(type: HapticType, enabled = true): Promise<void> {
  if (!enabled) return;
  try {
    switch (type) {
      case 'selection':
        await hapticSelection();
        break;
      case 'confirmation':
        await hapticMedium();
        break;
      case 'achievement':
        await hapticAchievement();
        break;
      case 'success':
        await hapticSuccess();
        break;
      case 'warning':
        await hapticWarning();
        break;
      case 'error':
        await hapticError();
        break;
    }
  } catch {
    // Haptics unavailable on simulator — silently ignore
  }
}
