// =============================================================================
// TRANSFORMR -- Accessibility Utilities
// =============================================================================

import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Minimum touch target size per Apple HIG and WCAG 2.1.
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Announce a message to screen readers (VoiceOver / TalkBack).
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if a screen reader is currently active.
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * Generate accessibility props for interactive elements.
 */
export function accessibleButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

/**
 * Generate accessibility props for progress indicators.
 */
export function accessibleProgress(label: string, current: number, max: number) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  return {
    accessible: true,
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: `${label}: ${percent}%`,
    accessibilityValue: {
      min: 0,
      max,
      now: current,
      text: `${percent}%`,
    },
  };
}

/**
 * Generate accessibility props for headings.
 */
export function accessibleHeading(text: string, level: 1 | 2 | 3 = 1) {
  return {
    accessible: true,
    accessibilityRole: 'header' as const,
    accessibilityLabel: text,
    ...(Platform.OS === 'ios' ? { accessibilityLevel: level } : {}),
  };
}

/**
 * Generate accessibility props for toggles/switches.
 */
export function accessibleToggle(label: string, isEnabled: boolean) {
  return {
    accessible: true,
    accessibilityRole: 'switch' as const,
    accessibilityLabel: label,
    accessibilityState: { checked: isEnabled },
  };
}

/**
 * Generate accessibility props for images.
 */
export function accessibleImage(description: string) {
  return {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: description,
  };
}

/**
 * Generate accessibility props for tab navigation items.
 */
export function accessibleTab(label: string, isSelected: boolean, index: number, total: number) {
  return {
    accessible: true,
    accessibilityRole: 'tab' as const,
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected: isSelected },
  };
}

/**
 * Reduce motion preference check (for users who prefer reduced motion).
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/**
 * Format a number for screen reader announcement.
 * E.g., 1500 -> "one thousand five hundred" instead of "fifteen hundred"
 */
export function accessibleNumber(value: number, unit?: string): string {
  const formatted = value.toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format a duration for screen reader announcement.
 */
export function accessibleDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} hour${hrs !== 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);

  return parts.join(', ');
}
