# Prompt 03: AICoachFAB Creation

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt creates a NEW file `apps/mobile/components/ui/AICoachFAB.tsx` and modifies the tab layout file ONLY to add the FAB mount. No other files are touched.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Create a persistent floating action button for AI Chat access, visible on all tab screens. This component was referenced in project intelligence but never built.

## Design Spec

### Visual
- Position: bottom-right, 16pt from right edge, 16pt above tab bar
- Size: 56pt diameter circle
- Background: cyan-to-purple gradient (`colors.gradient.cyanPurple`)
- Icon: Ionicons "chatbubble-ellipses" or "sparkles", 24pt, white
- Glow: cyan shadow (`colors.accent.cyan`), shadowOpacity 0.4, shadowRadius 16
- Pulse animation: subtle scale pulse (1.0 to 1.05) on 3-second loop using Reanimated

### Behavior
- **Tap:** Navigate to `/chat` via `router.push('/chat')`
- **Long-press (300ms):** Show quick-action menu with 3 options:
  1. "Voice Command" → trigger existing voice command service
  2. "Daily Briefing" → navigate to `/daily-briefing`
  3. "Weekly Review" → navigate to `/weekly-review`
- **Haptic:** `hapticLight()` on tap, `hapticMedium()` on long-press menu open

### Accessibility
- `accessibilityLabel="Open AI Coach chat"`
- `accessibilityRole="button"`
- `accessibilityHint="Long press for more AI options"`

### Implementation

```tsx
// apps/mobile/components/ui/AICoachFAB.tsx

import React, { useCallback, useRef, useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { hapticLight } from '@utils/haptics';

export function AICoachFAB() {
  // Implementation here
  // - Animated pulse
  // - Tap → router.push('/chat')
  // - Long-press → bottom sheet with 3 options
  // - Positioned absolute, bottom-right
}
```

### Mounting
In the tab layout file (`app/(tabs)/_layout.tsx`), add the FAB as a sibling to the tab navigator, positioned absolutely so it floats over all tab content.

**IMPORTANT:** The `_layout.tsx` modification must be MINIMAL:
1. Import `AICoachFAB`
2. Render `<AICoachFAB />` as a sibling to the `<Tabs>` component, NOT inside it
3. Do NOT change any `Tab.Screen` configuration
4. Do NOT change the tab bar component
5. Do NOT change any route paths

## Verification Gates
- [ ] AICoachFAB.tsx created at `components/ui/AICoachFAB.tsx`
- [ ] FAB visible on all 5 tab screens (Dashboard, Fitness, Nutrition, Goals, Profile)
- [ ] Tap navigates to `/chat`
- [ ] Long-press shows 3-option menu
- [ ] FAB does not overlap tab bar icons
- [ ] FAB does not block content interaction
- [ ] Cyan glow renders correctly in dark and light modes
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No existing _layout.tsx Tab.Screen configs changed
- [ ] No existing component files modified (only new file + minimal layout mount)

## Stores Touched
NONE.

## Navigation Touched
Tab layout modified ONLY to mount FAB component. No route changes.
