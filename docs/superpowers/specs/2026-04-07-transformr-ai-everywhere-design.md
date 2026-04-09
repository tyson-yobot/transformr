# TRANSFORMR — AI Everywhere & Integration Enhancement: Master Design Specification
## Date: 2026-04-07 | Status: Design Complete

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: AI Chat Coach](#2-phase-1-ai-chat-coach)
3. [Phase 2: Health Platform Integrations](#3-phase-2-health-platform-integrations)
4. [Phase 3: AI Insights Layer](#4-phase-3-ai-insights-layer)
5. [Phase 4: AI Predictive Engine](#5-phase-4-ai-predictive-engine)
6. [Phase 5: Nutrition AI Suite](#6-phase-5-nutrition-ai-suite)
7. [Phase 6: Weather & Context Engine](#7-phase-6-weather--context-engine)
8. [Phase 7: Smart Notifications](#8-phase-7-smart-notifications)
9. [Phase 8-9: Wearable & App Integrations](#9-phases-8-9-wearable--app-integrations)
10. [Phase 10: AI Workout Enhancements](#10-phase-10-ai-workout-enhancements)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Database Migration Summary](#12-database-migration-summary)
13. [Edge Function Summary](#13-edge-function-summary)
14. [Implementation Priority & Dependencies](#14-implementation-priority--dependencies)

---

## 1. Architecture Overview

### Existing Codebase (as of 2026-04-07)
- **226 TypeScript/TSX source files** across the mobile app
- **25 database migrations** applied
- **28 Edge Functions** deployed
- **14 AI service modules**, **17 hooks**, **14 Zustand stores**
- Full Expo Router app with auth, onboarding, tabs, and dozens of feature screens

### Established Patterns (all new code MUST follow these)

**Edge Functions**: Deno `serve()`, `corsHeaders` constant, `createClient` with service role for admin ops, Claude via `claude-sonnet-4-20250514`, JSON parse with fallback.

**AI Services**: Thin TypeScript wrappers in `services/ai/` calling `supabase.functions.invoke()` with typed body, returning typed result.

**Stores**: Zustand with explicit `State`/`Actions` interfaces, `create<Store>()((set, get) => ...)`, `isLoading` + `error` on every async action, MMKV for persisted settings.

**Hooks**: Thin wrappers composing stores with `useMemo` for derived data and `useEffect` for initialization.

**Calculations**: Pure functions in `services/calculations/` with explicit typed I/O, no Supabase calls.

**Types**: All DB types in `types/database.ts`, AI response types in `types/ai.ts`.

**Theme**: Dark mode first. `useTheme()` returns `{ colors, typography, spacing, borderRadius, isDark }`.

### New Feature Summary

| Phase | Feature | New Tables | New Edge Functions | New Files |
|-------|---------|-----------|-------------------|-----------|
| 1 | AI Chat Coach | 1 | 1 | ~10 |
| 2 | Health Platforms (Apple/Google) | 0 | 0 | ~6 |
| 3 | AI Insights Layer | 1 | 1 | ~8 |
| 4 | AI Predictive Engine | 1 | 3 | ~10 |
| 5 | Nutrition AI Suite | 3 | 5 | ~15 |
| 6 | Weather & Context | 2 | 1 | ~10 |
| 7 | Smart Notifications | 2 | 1 | ~5 |
| 8-9 | Wearable + App Integrations | 7 | 7 | ~21 |
| 10 | AI Workout Enhancements | 2 | 4 | ~20 |
| **Total** | | **19 tables** | **23 Edge Functions** | **~105 files** |

---

## Detailed Phase Specifications

Each phase has its own detailed spec file. The specs below are summaries — see the individual files for complete SQL, TypeScript, and implementation details.

### Individual Spec Files

- `specs/phase-01-ai-chat-coach.md` — Full AI Chat Coach specification
- `specs/phase-02-health-platforms.md` — Apple Health + Google Health Connect
- `specs/phase-03-ai-insights.md` — AI Insight cards on every screen
- `specs/phase-04-ai-predictive.md` — Predictive alerts, injury, deload
- `specs/phase-05-nutrition-ai.md` — NLP food, recipes, meal plans, macro cycling
- `specs/phase-06-weather.md` — Weather API, water optimization, caffeine tracking
- `specs/phase-07-smart-notifications.md` — AI-generated contextual notifications
- `specs/phase-08-09-integrations.md` — Wearables, Strava, Calendar, USDA, MFP
- `specs/phase-10-workout-ai.md` — Intensity adjustment, substitution, body comp, social, music

---

## 11. Cross-Cutting Concerns

### AI Model & Token Strategy
- All AI features use `claude-sonnet-4-20250514`
- Short outputs (notifications, insights): `max_tokens: 256`
- Medium outputs (chat, recipes): `max_tokens: 1024`
- Long outputs (meal plans, weekly reviews): `max_tokens: 2048`
- Context caching per session for AI Chat Coach to reduce token usage

### Error Handling Philosophy
Every AI feature degrades gracefully:
- AI Chat Coach fails → show "AI temporarily unavailable" message
- AI Insights fail → show last cached insight or hide card
- AI Predictions fail → skip that prediction cycle, retry next cron
- Wearable sync fails → log error, retry next poll, don't lose manual data
- Weather fails → use last cached data or default conservative values

### Offline-First Principles
- Workout logging, meal logging, water tracking MUST work offline
- AI features are online-only but never block offline core workflows
- Wearable data syncs when connection is restored
- Chat messages queue offline, send when reconnected

### Security
- All OAuth tokens encrypted server-side via Supabase Vault (pgsodium)
- Webhook signature verification per provider (HMAC-SHA256/SHA1)
- API keys stored as Deno environment secrets, never in mobile bundle
- RLS on every new table: `auth.uid() = user_id`
- Service role used only in Edge Functions for admin operations

---

## 12. Database Migration Summary

| Migration | Tables Created/Modified |
|-----------|----------------------|
| `00027_ai_chat_conversations.sql` | `ai_conversations` |
| `00028_ai_insights_cache.sql` | `ai_insights_cache` |
| `00029_create_ai_predictions.sql` | `ai_predictions` |
| `00030_nutrition_ai.sql` | `ai_meal_plans`, `user_pantry`, `ai_recipes` |
| `00031_weather_cache.sql` | `weather_cache`, `caffeine_logs` |
| `00032_smart_notifications.sql` | `smart_notification_rate_limits`, `smart_notification_preferences` |
| `00033_create_integration_tables.sql` | `wearable_connections`, `wearable_sync_log`, `wearable_daily_summaries`, `wearable_sleep_records`, `wearable_activities`, `calendar_events`, `mfp_import_jobs` |
| `00034_workout_ai.sql` | `user_equipment_profiles`, `ai_body_comp_snapshots` |
| `00035_profiles_weather.sql` | ALTER `profiles` add weather columns |
| `00036_foods_federation.sql` | ALTER `foods` add source, USDA, Nutritionix columns + search vector |

---

## 13. Edge Function Summary

| Function | Phase | Purpose | Trigger |
|----------|-------|---------|---------|
| `ai-chat` | 1 | Persistent AI coach with full user context | User message |
| `ai-insights` | 3 | Screen-specific AI insight generation | Screen load (cached) |
| `ai-predictive-alerts` | 4 | Analyze patterns, generate proactive warnings | Daily cron |
| `ai-injury-prediction` | 4 | Training pattern + pain log analysis | Daily cron |
| `ai-deload-detection` | 4 | Fatigue detection, auto-program deload | Daily cron |
| `ai-natural-language-food` | 5 | Parse natural language to structured nutrition | User input |
| `ai-recipe-generator` | 5 | Generate recipes from remaining macros | User request |
| `ai-meal-plan-weekly` | 5 | 7-day meal plan generation | Sunday cron / manual |
| `ai-macro-cycling` | 5 | Auto-adjust daily macros by training day | Daily cron |
| `ai-exercise-substitution` | 5 | Injury/equipment-aware exercise alternatives | Workout start |
| `weather-sync` | 6 | Fetch + cache weather data | Cron 2x/day + on-demand |
| `ai-smart-notification` | 7 | Generate contextual push notifications | Cron every 30 min |
| `integration-oauth` | 8 | Token exchange/refresh/revoke for all providers | OAuth callback |
| `garmin-webhook` | 8 | Receive Garmin activity/health data | Garmin push |
| `whoop-webhook` | 8 | Receive Whoop recovery/strain data | Whoop push |
| `oura-webhook` | 8 | Receive Oura sleep/readiness data | Oura push |
| `strava-webhook` | 9 | Bidirectional Strava activity sync | Strava push |
| `calendar-sync` | 9 | Google Calendar server-side sync | Hourly poll |
| `integration-sync` | 8-9 | Polling engine for Fitbit/backfill + MFP import | Hourly cron |
| `ai-workout-intensity` | 10 | Pre-workout adjustment based on readiness | Workout start |
| `ai-body-comp-estimator` | 10 | Body fat estimation from multiple signals | User request |
| `ai-social-caption` | 10 | Platform-specific social media captions | Post-workout share |

---

## 14. Implementation Priority & Dependencies

```
Phase 1: AI Chat Coach ─────────────────────────────────────────┐
  (no dependencies, highest engagement)                          │
                                                                 │
Phase 2: Health Platforms (Apple Health / Google Health Connect) ─┤
  (no dependencies, table stakes)                                │
                                                                 │
Phase 3: AI Insights Layer ──────────────────────────────────────┤
  (benefits from Phase 2 data but not required)                  │
                                                                 ├── Core AI Layer
Phase 4: AI Predictive Engine ───────────────────────────────────┤
  (depends on: existing data, benefits from Phase 2)             │
                                                                 │
Phase 5: Nutrition AI Suite ─────────────────────────────────────┤
  (independent, but NLP food log enhances Phase 3 insights)      │
                                                                 │
Phase 6: Weather & Context Engine ───────────────────────────────┘
  (independent, feeds into Phase 4 predictions + Phase 7 notifs)

Phase 7: Smart Notifications ────────────────────────────────────┐
  (depends on: Phase 4 predictions, Phase 6 weather)             │
                                                                 ├── Integration Layer
Phase 8-9: Wearable + App Integrations ─────────────────────────┤
  (independent, but data feeds all AI features)                  │
                                                                 │
Phase 10: AI Workout Enhancements ───────────────────────────────┘
  (benefits from: Phase 2 HRV data, Phase 6 weather)
```

### Recommended Build Order
1. **Phase 1** (AI Chat Coach) — build first, ship immediately
2. **Phase 2** (Apple Health / Google HC) — build in parallel with Phase 1
3. **Phase 3** (AI Insights) — after Phase 1 patterns established
4. **Phases 4-6** — can be built in parallel by separate developers/agents
5. **Phase 7** (Smart Notifications) — after Phases 4+6 complete
6. **Phases 8-9** (Integrations) — independent, can start anytime
7. **Phase 10** (Workout AI) — last, benefits from all prior phases

---

## Summary

This design specification covers **35+ new features and enhancements** that transform TRANSFORMR into the most AI-powered health app on the market:

- **1 persistent AI companion** (Chat Coach) accessible from every screen
- **10 AI enhancement layers** across existing features
- **9 wearable/health platform integrations**
- **5 app/service integrations**
- **6 new AI prediction/generation services**
- **19 new database tables**
- **23 new Edge Functions**
- **~105 new source files**

Every feature uses AI where possible. Every screen shows AI insights. Every notification is AI-generated. Every manual process is automated or AI-assisted.

No competitor has this combination: AI vision meal logging + AI form checking + AI adaptive programming + AI trajectory simulation + AI predictive injury alerts + AI recipe generation + AI natural language food logging + wearable integration with Garmin/Whoop/Oura + live couples sync + voice commands + NFC triggers + stake goals + a persistent AI coach that knows your entire life context.

**TRANSFORMR has all of them.**
