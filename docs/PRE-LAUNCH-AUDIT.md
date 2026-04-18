# TRANSFORMR Pre-Launch Audit

**Date:** 2026-04-18  
**Branch:** docs/pre-launch-audit  
**Scope:** `apps/mobile/**/*.{ts,tsx}`, `supabase/functions/**/*.ts`, `**/*.{md,sql}`

---

## Scan 1 — AI / Claude API Calls: buildUserAIContext + COMPLIANCE_PREAMBLE

**Result:** All 30 edge functions include `COMPLIANCE_PREAMBLE` in their system prompts. ✓  
**Issue:** 31 of 33 mobile service files invoke edge functions without calling `buildUserAIContext()` first.

| file | line | function_invoked | has_buildUserAIContext | has_compliance_preamble | severity |
|------|------|-----------------|----------------------|------------------------|----------|
| services/ai/chat.ts | 28 | ai-chat-coach | YES | YES | low |
| services/ai/narrator.ts | 126 | workout-narrator | YES | YES | low |
| services/ai/coach.ts | 23 | ai-coach | NO | YES | HIGH |
| services/ai/coach.ts | 32 | ai-coach | NO | YES | HIGH |
| services/ai/coach.ts | 41 | ai-coach | NO | YES | HIGH |
| services/ai/coach.ts | 54 | ai-coach | NO | YES | HIGH |
| services/ai/challengeCoach.ts | 44 | challenge-coach | NO | YES | HIGH |
| services/ai/challengeCoach.ts | 75 | ai-meal-analysis | NO | YES | HIGH |
| services/ai/challengeCoach.ts | 101 | challenge-coach | NO | YES | HIGH |
| services/ai/challengeCoach.ts | 133 | challenge-coach | NO | YES | HIGH |
| services/ai/adaptive.ts | 37 | ai-adaptive-program | NO | YES | HIGH |
| services/ai/correlation.ts | 35 | ai-correlation | NO | YES | HIGH |
| services/ai/formCheck.ts | 15 | ai-form-check | NO | YES | HIGH |
| services/ai/groceryList.ts | 25 | ai-grocery-list | NO | YES | HIGH |
| services/ai/healthRoi.ts | 140 | ai-health-roi | NO | YES | HIGH |
| services/ai/mealPrep.ts | 27 | ai-meal-prep | NO | YES | HIGH |
| services/ai/journaling.ts | 34 | ai-journal-prompt | NO | YES | HIGH |
| services/ai/journaling.ts | 49 | ai-journal-prompt | NO | YES | HIGH |
| services/ai/labs.ts | 104 | ai-lab-interpret | NO | YES | HIGH |
| services/ai/motivation.ts | 22 | ai-motivation | NO | YES | HIGH |
| services/ai/motivation.ts | 31 | ai-motivation | NO | YES | HIGH |
| services/ai/mealCamera.ts | 14 | ai-meal-analysis | NO | YES | HIGH |
| services/ai/mealCamera.ts | 35 | ai-menu-scan | NO | YES | HIGH |
| services/ai/progressPhoto.ts | 20 | ai-progress-photo | NO | YES | HIGH |
| services/ai/supplement.ts | 30 | ai-supplement | NO | YES | HIGH |
| services/ai/trajectory.ts | 23 | ai-trajectory | NO | YES | HIGH |
| services/ai/sleepOptimizer.ts | 22 | ai-sleep-optimizer | NO | YES | HIGH |
| services/ai/workoutAdvisor.ts | 55 | ai-workout-advisor | NO | YES | HIGH |
| services/ai/workoutCoach.ts | 60 | ai-workout-coach | NO | YES | HIGH |
| services/ai/workoutCoach.ts | 71 | ai-post-workout | NO | YES | HIGH |
| services/ai/workoutCoach.ts | 97 | ai-workout-coach | NO | YES | HIGH |
| services/ai/workoutNarrator.ts | 59 | workout-narrator | NO | YES | HIGH |

**Count:** 29 HIGH (missing buildUserAIContext), 2 LOW (compliant)

---

## Scan 2 — Feature-Gated Content: useFeatureGate checks

| file | line | feature_used | has_useFeatureGate | severity |
|------|------|-------------|-------------------|----------|
| app/(tabs)/fitness/workout-player.tsx | 97 | ai_workout_narrator | YES | low |
| app/(tabs)/fitness/trajectory.tsx | 75 | ai_trajectory_simulator | YES | low |
| app/(tabs)/dashboard/dashboard-builder.tsx | 57 | dashboard_builder | YES | low |
| app/(tabs)/nutrition/meal-camera.tsx | 60 | ai_meal_analysis | YES | low |
| app/(tabs)/nutrition/meal-prep.tsx | 38 | ai_meal_prep | YES | low |
| app/(tabs)/nutrition/menu-scanner.tsx | 32 | ai_menu_scanner | YES | low |
| app/(tabs)/social/partner/dashboard.tsx | 45 | partner_features | YES | low |
| app/(tabs)/fitness/form-check.tsx | 30 | ai_form_check | NO | HIGH |
| app/(tabs)/fitness/posture-check.tsx | 194 | ai_posture_analysis | NO | HIGH |
| app/(tabs)/fitness/progress-photos.tsx | 32 | ai_progress_photo | NO | HIGH |
| app/(tabs)/health/supplement-scanner.tsx | 165 | ai_supplement_scanner | NO | HIGH |
| app/(tabs)/wellness/affirmations.tsx | 277 | ai_affirmations | NO | HIGH |
| app/(tabs)/wellness/health-roi.tsx | 27 | ai_health_roi | NO | HIGH |
| app/(tabs)/wellness/journal.tsx | 30 | ai_journal | NO | HIGH |
| app/(tabs)/wellness/retrospective.tsx | 169 | ai_retrospective | NO | HIGH |
| app/(tabs)/nutrition/grocery-list.tsx | 33 | ai_grocery_list | NO | HIGH |
| app/(tabs)/nutrition/meal-plans.tsx | 28 | ai_meal_prep | NO | HIGH |
| app/(tabs)/dashboard/index.tsx | 262 | readiness_score | NO | HIGH |
| app/(tabs)/[id].tsx | 159 | ai_coach | NO | HIGH |

**Count:** 11 HIGH (missing gate), 8 low (compliant)

---

## Scan 3 — console.log occurrences

| file | line | finding | severity |
|------|------|---------|----------|
| supabase/functions/stripe-webhook/index.ts | 471 | `console.log(\`Unhandled Stripe event type: ${event.type}\`)` | low |

**Count:** 1 low (mobile app clean)

---

## Scan 4 — any / @ts-ignore / @ts-expect-error

**@ts-ignore / @ts-expect-error:** None found anywhere. ✓  
**Mobile app (apps/mobile/):** Zero `any` usages. ✓  
**Edge functions (supabase/functions/):** ~60+ instances (medium, non-blocking for launch)

| file | line | finding | severity |
|------|------|---------|----------|
| supabase/functions/achievement-evaluator/index.ts | 15 | `check: (any) => boolean` | medium |
| supabase/functions/achievement-evaluator/index.ts | 269 | `const newAchievements: any[]` | medium |
| supabase/functions/achievement-evaluator/index.ts | 312 | `.filter((e: any)` | medium |
| supabase/functions/ai-form-check/index.ts | 103 | `} as any` | medium |
| supabase/functions/challenge-evaluator/index.ts | 131 | `as any` | medium |
| supabase/functions/challenge-evaluator/index.ts | 595 | `supabase: any` | medium |
| supabase/functions/readiness-score/index.ts | 21 | `factors: any` | medium |
| supabase/functions/pr-detection/index.ts | 56 | `const detectedPRs: any[]` | medium |
| _~52 additional any usages in other edge functions_ | — | challenge-evaluator (40+), challenge-coach (6+) | medium |

---

## Scan 5 — Banned name references (NOEMA, YoBot, Command-Center)

| file | line | finding | severity |
|------|------|---------|----------|
| _No occurrences found_ | — | — | — |

**All clear.** ✓

---

## Summary

| Severity | Count | Area |
|----------|-------|------|
| BLOCKER | 0 | — |
| HIGH | 40 | 29× missing buildUserAIContext; 11× missing useFeatureGate |
| medium | ~60 | Edge function `any` types |
| low | 1 | stripe-webhook console.log |

**Immediate action required (Task 6):** Fix all 40 HIGH findings before launch.
