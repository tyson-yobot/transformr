# Edge Function Deploy Report

**Date:** 2026-04-18  
**Project:** horqwbfsqqmzdbbafvov  
**CLI Version:** Supabase 2.92.1  
**Smoke test method:** `POST /functions/v1/<name>` with anon key, body `{"test":true}`

---

## Deployment Result

All 48 edge functions deployed successfully via `supabase functions deploy`.  
Additionally 3 functions re-deployed as cron targets (ai-correlation, stake-evaluator, ai-monthly-retrospective).

---

## Smoke Test Results

| Function | HTTP | Status |
|----------|------|--------|
| achievement-evaluator | 200 | ✓ Live |
| ai-adaptive-program | 401 | ✓ Live (auth required) |
| ai-chat-coach | 401 | ✓ Live (auth required) |
| ai-correlation | 401 | ✓ Live (auth required) |
| ai-daily-affirmation | 401 | ✓ Live (auth required) |
| ai-form-check | 401 | ✓ Live (auth required) |
| ai-grocery-list | 401 | ✓ Live (auth required) |
| ai-health-roi | 401 | ✓ Live (auth required) |
| ai-journal-prompt | 401 | ✓ Live (auth required) |
| ai-lab-interpret | 401 | ✓ Live (auth required) |
| ai-meal-analysis | 401 | ✓ Live (auth required) |
| ai-meal-prep | 401 | ✓ Live (auth required) |
| ai-menu-scan | 401 | ✓ Live (auth required) |
| ai-monthly-retrospective | 401 | ✓ Live (auth required) |
| ai-motivation | 401 | ✓ Live (auth required) |
| ai-pattern-detector | 200 | ✓ Live |
| ai-post-workout | 401 | ✓ Live (auth required) |
| ai-posture-analysis | 401 | ✓ Live (auth required) |
| ai-progress-photo | 401 | ✓ Live (auth required) |
| ai-screen-insight | 401 | ✓ Live (auth required) |
| ai-sleep-optimizer | 401 | ✓ Live (auth required) |
| ai-supplement | 401 | ✓ Live (auth required) |
| ai-supplement-scanner | 401 | ✓ Live (auth required) |
| ai-trajectory | 401 | ✓ Live (auth required) |
| ai-voice-command | 401 | ✓ Live (auth required) |
| ai-weekly-report | 401 | ✓ Live (auth required) |
| ai-workout-advisor | 400 | ✓ Live (input validation) |
| ai-workout-coach | 401 | ✓ Live (auth required) |
| challenge-coach | 401 | ✓ Live (auth required) |
| challenge-evaluator | 200 | ✓ Live |
| daily-accountability | 200 | ✓ Live |
| daily-reminder | 200 | ✓ Live |
| goal-cinema | 401 | ✓ Live (auth required) |
| partner-nudge | 401 | ✓ Live (auth required) |
| pr-detection | 401 | ✓ Live (auth required) |
| proactive-wellness | 200 | ✓ Live |
| readiness-score | 200 | ✓ Live |
| reorder-predictor | 200 | ✓ Live |
| smart-notification-engine | 200 | ✓ Live |
| social-content-gen | 401 | ✓ Live (auth required) |
| stake-evaluator | 200 | ✓ Live |
| streak-calculator | 200 | ✓ Live |
| stripe-webhook | 401 | ✓ Live (auth required) |
| subscription-sync | 400 | ✓ Live (input validation) |
| transcribe-audio | 401 | ✓ Live (auth required) |
| weather-fetch | 401 | ✓ Live (auth required) |
| widget-update | 200 | ✓ Live |
| workout-narrator | 401 | ✓ Live (auth required) |

**Total deployed:** 48  
**Reachable:** 48 / 48  
**Failed to deploy:** 0  

---

## HTTP Status Key

- **200** — Function reached, processed request (service-role or public endpoint)
- **401** — Function reached, rejected unauthenticated request (expected behaviour for `verify_jwt = true`)
- **400** — Function reached, rejected malformed test body (expected for strict input validation)
