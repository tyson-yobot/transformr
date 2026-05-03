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
