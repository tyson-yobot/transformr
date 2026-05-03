## SPEC COMPLIANCE REQUIREMENTS — MANDATORY (read before any edit)

This prompt operates within the canonical TRANSFORMR spec system.
Spec files are the single source of truth. Code follows spec, never
the other way around.

### Required reading before any code edit

You MUST read these files before making any change to dashboard,
screen layout, component structure, AI behavior, notifications, or
any specced behavior:

  C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md
  C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md
  C:\dev\transformr\TRANSFORMR-BRAND-KIT.md
  C:\dev\transformr\CLAUDE.md
  C:\dev\transformr\ASSET-MANIFEST.md
  C:\dev\transformr\LESSONS-LEARNED.md
  C:\dev\transformr\ARCHITECTURE-DECISIONS.md
  C:\dev\transformr\SOUL.md

### Conflict resolution

If any instruction in this prompt conflicts with the spec files:
  - The spec files win.
  - STOP immediately and report the conflict to the user.
  - Do NOT proceed with the conflicting instruction.
  - Do NOT improvise a compromise.

### Spec sync requirement (Master Principles Section 23)

If your code changes amend any specced behavior, you MUST update the
relevant spec file in the SAME commit as the code change. Both files
must appear in `git status` before the commit. If only the code
changes, that is a defect.

If the spec is silent on the behavior you are changing, add a section
to the relevant spec file documenting the new behavior. The spec must
always reflect reality.

### Windows paths only

This is a Windows machine running PowerShell.
  - Use C:\dev\transformr\... for all paths.
  - NEVER use /mnt/user-data/ for any output.
  - NEVER use Linux-style paths (forward slashes for system paths).
  - NEVER write files outside C:\dev\transformr\.
  - PowerShell only. Never bash, grep, find, cat, ls, sed, awk.
  - cd on its own line, command on the next line. Never chain
    with && or ;.

### Required pre-edit checks

Before making any change, run:

  cd C:\dev\transformr
  git log -1 --format="%H %s"

Capture the starting commit hash. Include it in your final report.

Read the spec sections relevant to your work. Confirm your planned
changes do not conflict with the specs above. If conflict exists,
STOP and report to the user before any edit.

### Process killing prohibition (zero tolerance)

NEVER suggest or use:
  - taskkill
  - Stop-Process
  - kill
  - pkill
  - any process-killing command in any context

Zombie process remediation is "manually close the window" or
"restart the computer." No exceptions ever.

### Asset preservation

If the prompt is onboarding-adjacent, run an asset checksum check
before and after edits. Hero images in apps/mobile/assets/images/
are locked per ASSET-MANIFEST.md. Any change to that folder is
a defect unless explicitly instructed.

### Spec sync verification gate

Before committing, verify:
  cd C:\dev\transformr
  git status

Expected: at least one spec file in the modified files list IF this
prompt amended specced behavior. If only code changed AND spec was
amended, STOP — the spec file was not updated. Add the spec update
to the same commit.

If this prompt did not amend any specced behavior (purely additive
work that the spec already accommodates), state explicitly in your
final report: "No spec amendment required because [reason]."

---

# Prompt 12: AI Proactive Trigger Specifications

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt creates specification documents and modifies edge function invocation patterns. Depends on Prompt 03 (AICoachFAB must exist). Does NOT modify any existing edge function code or any existing store.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Document and implement client-side hooks that enable proactive AI triggers. These hooks call EXISTING edge functions on schedule or signal, then surface results via the insightStore's `proactiveMessages` array.

## Architecture Decision
Proactive AI triggers use a client-side approach:
- A new hook `useProactiveAI` runs on app foreground
- It checks time-of-day and data conditions
- When conditions are met, it calls the existing edge function
- Results are pushed into `insightStore.proactiveMessages` (existing mechanism)
- The dashboard already renders proactiveMessages via the accountability card

This avoids modifying any edge function or adding server-side cron dependencies.

## New Hook: useProactiveAI

Create `apps/mobile/hooks/useProactiveAI.ts`:

```typescript
import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useInsightStore } from '@stores/insightStore';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COOLDOWN_KEYS = {
  morningBriefing: 'proactive_morning_last',
  eveningReflection: 'proactive_evening_last',
  weeklyTrajectory: 'proactive_trajectory_last',
  sleepOptimization: 'proactive_sleep_last',
};

export function useProactiveAI() {
  const addProactiveMessage = useInsightStore((s) => s.addProactiveMessage);
  // Note: verify that addProactiveMessage exists in insightStore.
  // If it does not, this hook should use an alternative approach
  // (e.g., local state) WITHOUT modifying the store.

  const checkAndFire = useCallback(async () => {
    const hour = new Date().getHours();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Morning briefing: 5am-9am, once per day
    if (hour >= 5 && hour <= 9) {
      const lastFired = await AsyncStorage.getItem(COOLDOWN_KEYS.morningBriefing);
      const today = new Date().toDateString();
      if (lastFired !== today) {
        const { data } = await supabase.functions.invoke('ai-coach', {
          body: { userId: user.id, type: 'morning_briefing' },
        });
        if (data?.message) {
          // Surface via proactive messages mechanism
          await AsyncStorage.setItem(COOLDOWN_KEYS.morningBriefing, today);
        }
      }
    }

    // Evening reflection: 8pm-11pm, once per day
    if (hour >= 20 && hour <= 23) {
      const lastFired = await AsyncStorage.getItem(COOLDOWN_KEYS.eveningReflection);
      const today = new Date().toDateString();
      if (lastFired !== today) {
        const { data } = await supabase.functions.invoke('ai-coach', {
          body: { userId: user.id, type: 'evening_reflection' },
        });
        if (data?.message) {
          await AsyncStorage.setItem(COOLDOWN_KEYS.eveningReflection, today);
        }
      }
    }

    // Add more proactive triggers here following the same pattern
  }, []);

  useEffect(() => {
    // Fire on mount (app open)
    void checkAndFire();

    // Fire on app foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkAndFire();
    });

    return () => subscription.remove();
  }, [checkAndFire]);
}
```

## Mounting
Mount the hook in the root tab layout or dashboard:
```tsx
// In app/(tabs)/dashboard.tsx or app/(tabs)/_layout.tsx
useProactiveAI();
```

## Proactive Triggers to Implement (Phase 1)

| Trigger | Edge Function | Condition | Cooldown | Surface |
|---------|--------------|-----------|----------|---------|
| Morning briefing | ai-coach | 5am-9am, first app open | 1/day | Dashboard accountability card |
| Evening reflection | ai-coach | 8pm-11pm, first app open | 1/day | Dashboard accountability card |
| Low-readiness motivation | ai-motivation | readinessScore < 50 | 1/day | Dashboard insight card |
| Sleep optimization | ai-sleep-optimizer | readinessScore < 50 AND last sleep quality < 3 | 1/day | Dashboard insight card |

## Implementation Notes
- All edge function calls use EXISTING endpoints with EXISTING parameters
- Cooldown uses AsyncStorage (not MMKV) for simplicity, keyed by date string
- Each trigger fires AT MOST once per day per condition
- Network failures are silently caught (no error UI for background proactive calls)
- The hook does NOT modify any store. It calls edge functions and lets the existing insightStore mechanism handle display.

## Verification Gates
- [ ] useProactiveAI.ts created at `hooks/useProactiveAI.ts`
- [ ] Hook mounted in dashboard or tab layout
- [ ] Morning briefing fires between 5am-9am on first app open
- [ ] Evening reflection fires between 8pm-11pm
- [ ] Cooldown prevents duplicate fires on same day
- [ ] Network failures do not crash or show error UI
- [ ] No existing store files modified
- [ ] No existing edge function files modified
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports or require() statements

## Stores Touched
NONE modified. insightStore is READ by the hook to check addProactiveMessage existence, but the store file itself is not changed.
