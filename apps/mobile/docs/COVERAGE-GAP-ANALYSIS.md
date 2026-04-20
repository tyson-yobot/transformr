# TRANSFORMR Coverage Gap Analysis

**Generated:** 2026-04-18
**Branch:** test/full-coverage

## Baseline (Post Phase 0 — All 348 Tests Passing)

| Metric | Value | Notes |
|--------|-------|-------|
| Statements | 3.85% (612/15,895) | Low because collectCoverageFrom now includes all screens/components/stores |
| Branches | 3.56% (389/10,905) | |
| Functions | 3.23% (130/4,022) | |
| Lines | 3.74% (524/13,989) | |

**Pre-expansion baseline** (calculations + utils only):
- Statements: 46.34% (342/738) — this was the original narrow scope

## collectCoverageFrom Expansion

The jest config now covers:
```
services/**/*.ts
utils/**/*.ts
stores/**/*.ts
hooks/**/*.ts
components/**/*.{ts,tsx}
app/**/*.{ts,tsx}
```

## Files Below 100% — 313 Total

### P1 — Calculation utilities (6 files)

| File | Stmt% | Branch% | Fn% | Line% | ~Uncovered stmts |
|------|-------|---------|-----|-------|------------------|
| projections.ts | 0 | 0 | 0 | 0 | 73 |
| challengeVerification.ts | 0 | 0 | 0 | 0 | 150 |
| dayScore.ts | 88.63 | 82.6 | 100 | 96.87 | 3 |
| readiness.ts | 98.38 | 96.15 | 100 | 98.03 | 1 |
| streaks.ts | 98.03 | 93.1 | 100 | 100 | 1 |
| prDetection.ts | 100 | 94.33 | 100 | 100 | 0 (branch only) |

### P2 — Stores (21 files)

| File | Stmt% | Branch% | Fn% |
|------|-------|---------|-----|
| authStore.ts | 40.84 | 35.24 | 72.22 |
| nutritionStore.ts | 61.46 | 51.51 | 65 |
| workoutStore.ts | 67.03 | 56.66 | 72.72 |
| businessStore.ts | 0 | 0 | 0 |
| challengeStore.ts | 0 | 0 | 0 |
| chatStore.ts | 0 | 0 | 0 |
| dashboardStore.ts | 0 | 0 | 0 |
| financeStore.ts | 0 | 0 | 0 |
| gamificationStore.ts | 0 | 0 | 0 |
| goalStore.ts | 0 | 0 | 0 |
| habitStore.ts | 0 | 0 | 0 |
| insightStore.ts | 0 | 0 | 0 |
| labsStore.ts | 0 | 0 | 0 |
| moodStore.ts | 0 | 0 | 0 |
| offlineSyncStore.ts | 0 | 0 | 0 |
| partnerStore.ts | 0 | 0 | 0 |
| profileStore.ts | 0 | 0 | 0 |
| settingsStore.ts | 0 | 0 | 0 |
| sleepStore.ts | 0 | 0 | 0 |
| subscriptionStore.ts | 0 | 0 | 0 |
| supplementsStore.ts | 0 | 0 | 0 |

### P3 — Custom hooks (28 files — all at 0%)

Need to discover and list all hook files in `hooks/`.

### P4 — AI services (19 files)

| File | Stmt% | Branch% | Fn% |
|------|-------|---------|-----|
| coach.ts | 100 | 100 | 100 |
| mealCamera.ts | 100 | 100 | 100 |
| motivation.ts | 100 | 100 | 100 |
| trajectory.ts | 100 | 100 | 100 |
| context.ts | 17.77 | 0 | 4.34 |
| formCheck.ts | 35 | 50 | 50 |
| compliance.ts | 0 | 100 | 100 |
| adaptive.ts | 0 | 0 | 0 |
| challengeCoach.ts | 0 | 0 | 0 |
| chat.ts | 0 | 0 | 0 |
| correlation.ts | 0 | 0 | 0 |
| groceryList.ts | 0 | 0 | 0 |
| healthRoi.ts | 0 | 0 | 0 |
| journaling.ts | 0 | 0 | 0 |
| labs.ts | 0 | 0 | 0 |
| mealPrep.ts | 0 | 0 | 0 |
| narrator.ts | 0 | 0 | 0 |
| progressPhoto.ts | 0 | 0 | 0 |
| sleepOptimizer.ts | 0 | 0 | 0 |
| supplement.ts | 0 | 0 | 0 |
| workoutAdvisor.ts | 0 | 0 | 0 |
| workoutCoach.ts | 0 | 0 | 0 |
| workoutNarrator.ts | 0 | 0 | 0 |

### P4 — Other services (25 files — health, integrations, sync)

All at 0%: appleHealth.ts, googleHealth.ts, calendar.ts, spotify.ts, strava.ts, usda.ts, and ~19 others.

### P5 — Utilities (8 files)

| File | Stmt% | Branch% | Fn% |
|------|-------|---------|-----|
| formatters.ts | 72.72 | 73.52 | 80 |
| storage.ts | 44 | 66.66 | 20 |
| haptics.ts | 0 | 100 | 0 |
| accessibility.ts | 0 | 0 | 0 |
| colors.ts | 0 | 0 | 0 |
| greetings.ts | 0 | 0 | 0 |
| muscleMapping.ts | 0 | 0 | 0 |
| performance.ts | 0 | 0 | 0 |

### P6 — Components (103 files — all at 0%)

Includes ui/, cards/, charts/, nutrition/, partner/, workout/, etc.

### P7 — Screens / app (103 files — all at 0%)

Includes (auth)/, (tabs)/dashboard.tsx, (tabs)/fitness/*, (tabs)/nutrition/*, (tabs)/goals/*, (tabs)/profile/*, labs/*, partner/*.

## Execution Order

1. **Phase 2**: Finish calculation gaps (projections, challengeVerification, dayScore branch, prDetection branch)
2. **Phase 3**: All 21 stores
3. **Phase 4**: All 28 hooks
4. **Phase 5**: All service files (AI + health + integrations)
5. **Phase 5b**: Utility gaps (formatters, storage, haptics, accessibility, colors, greetings, muscleMapping, performance)
6. **Phase 6**: 103 components (requires React Native test renderer setup)
7. **Phase 7**: 103 screens (heaviest — navigation, data loading, interactions)

## Global Jest Setup Needed

Before Phase 6, create `jest.setup.ts` with global mocks for all expo/RN native modules.
