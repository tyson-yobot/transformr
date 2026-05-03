# Prompt 08: Profile Home State Completeness

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies ONLY `apps/mobile/app/(tabs)/profile/index.tsx`.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Add loading skeleton, error state, and refresh control to the Profile Home screen, which currently has none of these (lowest state completeness score in the audit).

## Required Changes

### 1. Add Loading Skeleton
Import `ListSkeleton` from `@components/ui/ScreenSkeleton` (or the appropriate skeleton component). Show skeleton while profile data is loading.

### 2. Add RefreshControl
Wrap the existing ScrollView (or add one if missing) with a RefreshControl that calls `fetchProfile()` on pull.

### 3. Add Error State
If profile fetch fails, show an error banner with retry capability:
```tsx
{profileError && (
  <Pressable onPress={() => { void fetchProfile(); }} style={errorBannerStyles}>
    <Text>Failed to load profile. Tap to retry.</Text>
  </Pressable>
)}
```

### 4. Preserve All Existing Content
The profile screen contains navigation links (Edit Profile, Achievements, Partner, Dashboard Builder, Integrations, Notifications, NFC, Wearables, Data Export, About). ALL must remain. The visual layout, order, and styling must not change.

## Verification Gates
- [ ] Skeleton shows during initial load
- [ ] Pull-to-refresh works and refreshes profile data
- [ ] Error banner shows on network failure with retry
- [ ] All navigation links still work
- [ ] All existing content preserved (count items before/after)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports

## Stores Touched
NONE modified. profileStore.fetchProfile called (existing action).
