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

# Prompt 09: Daily Briefing Wayfinding Fix

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies ONLY `apps/mobile/app/daily-briefing.tsx`.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Add navigation affordances and help content to the Daily Briefing screen, which currently has no way out except the back button (dead-end risk) and no help system integration.

## Required Changes

### 1. Add HelpIcon in Header
Import `HelpIcon` and `SCREEN_HELP` if not already imported. Add to the screen header:
```tsx
<HelpIcon content={{
  title: 'Daily Briefing',
  body: 'Your AI coach summarizes your current state and gives you one clear priority for today. This briefing is generated from your actual data, not generic advice.',
  proTip: 'Check your briefing every morning before making decisions about today\'s training and nutrition.',
}} size={20} />
```

### 2. Add Action Buttons at Bottom
After the briefing content, add contextual action buttons:
```tsx
<View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
  <Pressable onPress={() => router.push('/(tabs)/fitness')} style={actionButtonStyle}>
    <Ionicons name="barbell-outline" size={20} color={colors.accent.primary} />
    <Text>Start Workout</Text>
  </Pressable>
  <Pressable onPress={() => router.push('/(tabs)/nutrition/add-food')} style={actionButtonStyle}>
    <Ionicons name="restaurant-outline" size={20} color={colors.accent.success} />
    <Text>Log Meal</Text>
  </Pressable>
</View>
<Pressable onPress={() => router.push('/(tabs)/dashboard')} style={dashboardLinkStyle}>
  <Text>Go to Dashboard</Text>
</Pressable>
```

### 3. Preserve All Existing Content
The briefing content, any existing AI-generated sections, back button, and styling must remain unchanged.

## Verification Gates
- [ ] HelpIcon renders in header
- [ ] "Start Workout" navigates to fitness tab
- [ ] "Log Meal" navigates to add-food
- [ ] "Go to Dashboard" navigates to dashboard
- [ ] Back button still works
- [ ] Existing briefing content unchanged
- [ ] `npx tsc --noEmit` passes with 0 errors

## Stores Touched
NONE.
