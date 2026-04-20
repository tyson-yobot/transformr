# TRANSFORMR — Codebase Discovery Report
Generated: 2026-04-18

---

## PROJECT CONFIGURATION

| Key | Value |
|-----|-------|
| **App Name** | TRANSFORMR |
| **Bundle ID / Android Package** | `com.automateai.transformr` |
| **Version** | 1.0.0 |
| **Framework** | React Native + Expo (SDK 53), Expo Router (file-based routing) |
| **State Management** | Zustand 4.5.7 (21 stores) |
| **Database** | Supabase (PostgreSQL + Edge Functions + RLS) |
| **Authentication** | Supabase Auth (email/password, Google OAuth, Apple Sign-In) |
| **API Base URL** | `https://horqwbfsqqmzdbbafvov.supabase.co` |
| **App Scheme** | `com.automateai.transformr` |
| **Environment** | `development` |
| **Support Email** | `support@transformr.ai` |
| **Help Center** | `https://construktrtm.zendesk.com/hc` |

### Files Checked at Root
- `SOUL.md` — **does not exist**
- `CONFIGURATION_LOCK.md` — **does not exist**
- `CLAUDE.md` — exists (preservation directives for AI agents)
- `.env` — exists (root-level, contains live API keys)
- `apps/mobile/.env` — exists (mobile-level, mostly placeholder values)
- `apps/mobile/app.json` — exists (main app config)
- `apps/mobile/app.config.ts` — **does not exist**

### Key Environment Variables (`.env`)
| Variable | Status |
|----------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Set (`https://horqwbfsqqmzdbbafvov.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Set (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Set (JWT) |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Set (`sk-ant-api03-...`) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Set (`pk_live_...`) |
| `STRIPE_SECRET_KEY` | Set (`sk_live_...`) |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Set |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | **Empty** |
| `EXPO_PUBLIC_OPEN_FOOD_FACTS_API` | Set (`https://world.openfoodfacts.org/api/v2`) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Set |
| `TWILIO_PHONE_NUMBER` | `+18663796036` |
| `ZENDESK_SUBDOMAIN` | `construktrtm` |

---

## 1. SCREEN FILES — COMPLETE INVENTORY (95+)

### Root
- `apps/mobile/app/index.tsx` — Welcome/splash screen routing logic
- `apps/mobile/app/_layout.tsx` — Root layout with providers (GestureHandler → SafeAreaProvider → StripeProvider → QueryClient → Theme)
- `apps/mobile/app/error.tsx` — Error boundary screen

### Auth Group (`app/(auth)/`)
- `login.tsx` — Email/password sign-in
- `register.tsx` — New account creation
- `forgot-password.tsx` — Password reset
- `callback.tsx` — OAuth redirect handler
- `onboarding/welcome.tsx` — Intro screen
- `onboarding/profile.tsx` — User info collection
- `onboarding/goals.tsx` — Goal selection
- `onboarding/fitness.tsx` — Fitness profile setup
- `onboarding/nutrition.tsx` — Nutrition preferences
- `onboarding/business.tsx` — Business goals (optional)
- `onboarding/partner.tsx` — Partner linking
- `onboarding/notifications.tsx` — Notification preferences
- `onboarding/ready.tsx` — Completion screen

### Tab: Dashboard (`app/(tabs)/`)
- `dashboard.tsx` — Main overview with greeting, workouts, weight chart, AI insights, macros, widgets

### Tab: Fitness (`app/(tabs)/fitness/`)
- `index.tsx` — Workout hub (recent workouts, weight chart, navigation cards)
- `exercises.tsx` — Exercise library (100+ exercises with anatomy)
- `form-check.tsx` — AI video form analysis
- `mobility.tsx` — Mobility work
- `pain-tracker.tsx` — Body pain mapping
- `posture-check.tsx` — Posture analysis
- `progress.tsx` — Progress tracking
- `progress-photos.tsx` — Before/after photo progress
- `supplement-scanner.tsx` — Supplement label scanner
- `workout-player.tsx` — Active workout player
- `workout-summary.tsx` — Workout recap
- `programs.tsx` — Workout programs
- `marketplace.tsx` — Program marketplace
- `exercise-detail.tsx` — Individual exercise details

### Tab: Nutrition (`app/(tabs)/nutrition/`)
- `index.tsx` — Daily nutrition tracker (meal cards, macros, water)
- `add-food.tsx` — Manual food entry
- `analytics.tsx` — Nutrition analytics
- `barcode-scanner.tsx` — Barcode scanning for foods
- `grocery-list.tsx` — Shopping list
- `meal-camera.tsx` — AI meal photo analysis
- `meal-plans.tsx` — Saved meal plans
- `meal-prep.tsx` — Meal prep guide
- `menu-scanner.tsx` — Restaurant menu scanning
- `saved-meals.tsx` — Saved meal database
- `supplements.tsx` — Supplement tracking

### Tab: Goals (`app/(tabs)/goals/`)
- `index.tsx` — Goal dashboard (goals by category, create modal)
- `[id].tsx` — Individual goal detail (dynamic route)
- `habits.tsx` — Daily habits tracking
- `mood.tsx` — Mood check-ins
- `sleep.tsx` — Sleep logging
- `journal.tsx` — Journal entries
- `focus-mode.tsx` — Deep focus timer
- `skills.tsx` — Skill development
- `stake-goals.tsx` — Financial stakes on goals
- `vision-board.tsx` — Vision board builder
- `affirmations.tsx` — Daily affirmations
- `insights.tsx` — AI insights & predictions
- `health-roi.tsx` — Health ROI calculator
- `challenges.tsx` — Challenge browse & enroll
- `challenge-builder.tsx` — Create custom challenges
- `challenge-active.tsx` — Active challenge tracking
- `challenge-detail.tsx` — Challenge details
- `community.tsx` — Community leaderboard
- `retrospective.tsx` — Retrospective/weekly review
- `business/index.tsx` — Business overview
- `business/customers.tsx` — Customer tracking
- `business/revenue.tsx` — Revenue logging
- `business/milestones.tsx` — Business milestones
- `finance/index.tsx` — Finance overview
- `finance/budgets.tsx` — Budget management
- `finance/transactions.tsx` — Transaction logging
- `finance/net-worth.tsx` — Net worth tracking

### Tab: Profile (`app/(tabs)/profile/`)
- `index.tsx` — Profile & settings (user stats, theme toggle, nav items)
- `about.tsx` — About screen
- `achievements.tsx` — Achievement badges
- `integrations.tsx` — Third-party integrations (Spotify, Strava, etc.)
- `wearables.tsx` — Wearable device setup
- `nfc-setup.tsx` — NFC tag configuration
- `edit-profile.tsx` — Profile editor
- `notifications-settings.tsx` — Notification preferences
- `dashboard-builder.tsx` — Customize dashboard widgets
- `data-export.tsx` — Data export functionality
- `partner.tsx` — Partner management

### Full-Screen Modals (outside tabs)
- `app/chat.tsx` — AI Chat Coach (multi-topic, conversation history)
- `app/chat-history.tsx` — Chat conversation history
- `app/daily-briefing.tsx` — Morning briefing screen
- `app/weekly-review.tsx` — Weekly retrospective
- `app/goal-cinema.tsx` — Goal visualization/animation
- `app/trajectory.tsx` — Trajectory/projection viewer
- `app/upgrade.tsx` — Premium upgrade prompt

### Partner Group (`app/partner/`)
- `dashboard.tsx` — Partner dashboard
- `challenges.tsx` — Partner challenges
- `live-workout.tsx` — Live workout sync with partner
- `nudge.tsx` — Send motivational nudge

### Labs Group (`app/labs/`)
- `index.tsx` — Labs feature hub
- `detail.tsx` — Lab test result detail
- `upload.tsx` — Lab result upload & AI interpretation

---

## 2. SERVICES — COMPLETE INVENTORY

### Core Services (`services/`)
| File | Purpose | Status |
|------|---------|--------|
| `supabase.ts` | Supabase client init, AsyncStorage auth persistence | Working |
| `notifications.ts` | Push notification registration & channel setup | Working |
| `analytics.ts` | Event tracking | Stub |
| `commerce.ts` | Payment & subscription handling | Partial |
| `voice.ts` | Voice command parsing, STT/TTS wrappers | Stub |
| `strava.ts` | Strava workout sync & activity fetching | Partial |
| `spotify.ts` | Spotify auth & track/playlist integration | Partial |
| `calendar.ts` | iOS/Android calendar event creation | Partial |
| `health.ts` | Apple Health & Google Health Connect unified interface | Partial |
| `usda.ts` | USDA FoodData Central nutrition lookup | Working |
| `weather.ts` | OpenWeatherMap (key not set in .env) | Stub |
| `barcode.ts` | Barcode scanning setup & food lookup | Working |
| `nfc.ts` | NFC tag reading for automation triggers | Stub |
| `geofence.ts` | Location-based gym auto-start detection | Stub |
| `widgets.ts` | Home screen widget registration | Stub |
| `watch.ts` | Apple Watch & Wear OS companion features | Stub |
| `heroImagePreloader.ts` | Pre-cache hero images for screens | Working |

### AI Services (`services/ai/`)
| File | Purpose | Status |
|------|---------|--------|
| `chat.ts` | AI Chat Coach — multi-topic via Edge Function | Working |
| `coach.ts` | Morning briefing, evening reflection, workout advice | Working |
| `narrator.ts` | Real-time workout audio cues during sessions | Working |
| `context.ts` | Build user AI context from all stores | Working |
| `formCheck.ts` | Video form analysis via AI | Stub |
| `progressPhoto.ts` | Progress photo analysis & comparison | Stub |
| `mealCamera.ts` | Meal photo AI macro estimation | Stub |
| `mealPrep.ts` | AI meal prep planning | Partial |
| `supplement.ts` | Supplement recommendations based on stack | Stub |
| `workoutCoach.ts` | Real-time workout coaching | Working |
| `workoutAdvisor.ts` | Workout plan recommendations | Partial |
| `workoutNarrator.ts` | Deprecated (use `narrator.ts`) | Deprecated |
| `journaling.ts` | Journaling prompts & insights | Stub |
| `sleepOptimizer.ts` | Sleep optimization recommendations | Stub |
| `motivation.ts` | Motivation & streak-based messaging | Working |
| `labs.ts` | Lab result interpretation & biomarker tracking | Stub |
| `correlation.ts` | Data correlation analysis (sleep → performance) | Stub |
| `healthRoi.ts` | ROI calculations for health decisions | Stub |
| `groceryList.ts` | AI-generated shopping lists from meal plans | Stub |
| `trajectory.ts` | Weight/goal trajectory projections | Partial |
| `challengeCoach.ts` | Challenge-specific AI coaching | Working |
| `adaptive.ts` | Adaptive difficulty based on performance | Partial |
| `compliance.ts` | Compliance check for AI responses (disclaimers) | Working |

### Calculation Services (`services/calculations/`)
| File | Purpose | Status |
|------|---------|--------|
| `bmr.ts` | Basal Metabolic Rate calculation | Working |
| `macros.ts` | Macro split recommendations | Working |
| `readiness.ts` | Readiness score (sleep, stress, HRV) | Working |
| `dayScore.ts` | Daily performance score | Working |
| `streaks.ts` | Habit & workout streak calculations | Working |
| `prDetection.ts` | Personal Record detection algorithm | Working |
| `projections.ts` | Weight & goal projections | Working |
| `challengeVerification.ts` | Challenge task verification logic | Working |

---

## 3. STORES — ALL 21 ZUSTAND STORES

### Identity & Auth
| Store | File | State Shape |
|-------|------|-------------|
| `authStore` | `stores/authStore.ts` | `session`, `user`, `loading`, `error`, `rateLimitSeconds` |
| `profileStore` | `stores/profileStore.ts` | User metadata: age, goals, preferences |

### Fitness Domain
| Store | File | State Shape |
|-------|------|-------------|
| `workoutStore` | `stores/workoutStore.ts` | `activeSession`, `templates`, `exercises`, `isLoading`, `error`, `pendingExerciseId` |
| `habitStore` | `stores/habitStore.ts` | `habits`, `todayCompletions`, `allCompletions`, `overallStreak` |

### Nutrition Domain
| Store | File | State Shape |
|-------|------|-------------|
| `nutritionStore` | `stores/nutritionStore.ts` | `todayLogs`, `waterLogs`, `supplements`, `supplementLogs`, `searchResults`, `foodNameMap` |
| `supplementsStore` | `stores/supplementsStore.ts` | Supplement inventory, schedules, adherence |
| `moodStore` | `stores/moodStore.ts` | `todayMood`, `moodHistory` |
| `sleepStore` | `stores/sleepStore.ts` | `lastSleep`, `sleepHistory` |

### Goals & Challenges
| Store | File | State Shape |
|-------|------|-------------|
| `goalStore` | `stores/goalStore.ts` | `goals`, `milestones`, `isLoading`, `error` |
| `challengeStore` | `stores/challengeStore.ts` | `challengeDefinitions`, `activeEnrollment`, `enrollments`, `dailyLogs`, `todayLog` |

### Financial & Business
| Store | File | State Shape |
|-------|------|-------------|
| `businessStore` | `stores/businessStore.ts` | `businesses`, `revenueData`, `expenseData` |
| `financeStore` | `stores/financeStore.ts` | `accounts`, `transactions`, `budgets`, `netWorthHistory` |

### AI & Content
| Store | File | State Shape |
|-------|------|-------------|
| `chatStore` | `stores/chatStore.ts` | `conversations`, `activeConversationId`, `messagesByConversation`, `isLoadingConversations`, `isLoadingMessages`, `isSending` |
| `insightStore` | `stores/insightStore.ts` | `predictions`, `proactiveMessages`, `isLoading`, `error` |
| `labsStore` | `stores/labsStore.ts` | `uploads`, `detailsByUploadId`, `biomarkerHistoryByName`, `signedUrlByPath` |

### Dashboard & Personalization
| Store | File | State Shape |
|-------|------|-------------|
| `dashboardStore` | `stores/dashboardStore.ts` | `layout` (widgets array), `availableWidgets`, `isLoading`, `error` |
| `gamificationStore` | `stores/gamificationStore.ts` | `tone` ('drill_sergeant' \| 'motivational' \| 'balanced' \| 'calm') |

### Partner Features
| Store | File | State Shape |
|-------|------|-------------|
| `partnerStore` | `stores/partnerStore.ts` | `partnership`, `partnerProfile`, `isLoading`, `error`, `pendingInviteCode` |

### Settings & Sync
| Store | File | State Shape |
|-------|------|-------------|
| `settingsStore` | `stores/settingsStore.ts` | Theme mode, notifications, privacy, integrations |
| `subscriptionStore` | `stores/subscriptionStore.ts` | `tier` (free\|pro\|elite\|partners), `usage`, `expiresAt`, `stripeCustomerId` |
| `offlineSyncStore` | `stores/offlineSyncStore.ts` | Pending mutations queue |

---

## 4. NAVIGATION STRUCTURE

```
Root (_layout.tsx)
Providers: GestureHandler → SafeAreaProvider → StripeProvider → QueryClient → Theme
│
├── (auth)/                          [Conditional: shown if not authenticated]
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── callback.tsx                 [OAuth redirect]
│   └── onboarding/
│       ├── welcome.tsx
│       ├── profile.tsx
│       ├── goals.tsx
│       ├── fitness.tsx
│       ├── nutrition.tsx
│       ├── business.tsx
│       ├── partner.tsx
│       ├── notifications.tsx
│       └── ready.tsx
│
├── (tabs)/                          [5 Main Tabs]
│   ├── dashboard.tsx                [Tab 1: Dashboard]
│   ├── fitness/
│   │   ├── index.tsx                [Tab 2: Fitness]
│   │   ├── exercises.tsx
│   │   ├── form-check.tsx
│   │   ├── mobility.tsx
│   │   ├── pain-tracker.tsx
│   │   ├── posture-check.tsx
│   │   ├── progress.tsx
│   │   ├── progress-photos.tsx
│   │   ├── supplement-scanner.tsx
│   │   ├── workout-player.tsx
│   │   ├── workout-summary.tsx
│   │   ├── programs.tsx
│   │   ├── marketplace.tsx
│   │   └── exercise-detail.tsx
│   ├── nutrition/
│   │   ├── index.tsx                [Tab 3: Nutrition]
│   │   ├── add-food.tsx
│   │   ├── analytics.tsx
│   │   ├── barcode-scanner.tsx
│   │   ├── grocery-list.tsx
│   │   ├── meal-camera.tsx
│   │   ├── meal-plans.tsx
│   │   ├── meal-prep.tsx
│   │   ├── menu-scanner.tsx
│   │   ├── saved-meals.tsx
│   │   └── supplements.tsx
│   ├── goals/
│   │   ├── index.tsx                [Tab 4: Goals]
│   │   ├── [id].tsx
│   │   ├── habits.tsx
│   │   ├── mood.tsx
│   │   ├── sleep.tsx
│   │   ├── journal.tsx
│   │   ├── focus-mode.tsx
│   │   ├── skills.tsx
│   │   ├── stake-goals.tsx
│   │   ├── vision-board.tsx
│   │   ├── affirmations.tsx
│   │   ├── insights.tsx
│   │   ├── health-roi.tsx
│   │   ├── challenges.tsx
│   │   ├── challenge-builder.tsx
│   │   ├── challenge-active.tsx
│   │   ├── challenge-detail.tsx
│   │   ├── community.tsx
│   │   ├── retrospective.tsx
│   │   ├── business/
│   │   │   ├── index.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── revenue.tsx
│   │   │   └── milestones.tsx
│   │   └── finance/
│   │       ├── index.tsx
│   │       ├── budgets.tsx
│   │       ├── transactions.tsx
│   │       └── net-worth.tsx
│   └── profile/
│       ├── index.tsx                [Tab 5: Profile]
│       ├── about.tsx
│       ├── achievements.tsx
│       ├── integrations.tsx
│       ├── wearables.tsx
│       ├── nfc-setup.tsx
│       ├── edit-profile.tsx
│       ├── notifications-settings.tsx
│       ├── dashboard-builder.tsx
│       ├── data-export.tsx
│       └── partner.tsx
│
├── Full-Screen Modals (outside tabs)
│   ├── chat.tsx
│   ├── chat-history.tsx
│   ├── daily-briefing.tsx
│   ├── weekly-review.tsx
│   ├── goal-cinema.tsx
│   ├── trajectory.tsx
│   ├── upgrade.tsx
│   └── error.tsx
│
├── partner/
│   ├── dashboard.tsx
│   ├── challenges.tsx
│   ├── live-workout.tsx
│   └── nudge.tsx
│
└── labs/
    ├── index.tsx
    ├── detail.tsx
    └── upload.tsx
```

---

## 5. ENTITIES & API ENDPOINTS

### Supabase Tables (RLS-protected)

| Table | Domain | Operations |
|-------|--------|-----------|
| `profiles` | Auth | SELECT, UPDATE (own row) |
| `workout_sessions` | Fitness | SELECT, INSERT, UPDATE |
| `workout_sets` | Fitness | SELECT, INSERT, UPDATE, DELETE |
| `exercises` | Fitness | SELECT (library) |
| `personal_records` | Fitness | SELECT, INSERT |
| `workout_templates` | Fitness | SELECT, INSERT, DELETE |
| `nutrition_logs` | Nutrition | SELECT, INSERT, DELETE |
| `foods` | Nutrition | SELECT (search) |
| `water_logs` | Nutrition | SELECT, INSERT, DELETE |
| `supplements` | Nutrition | SELECT, INSERT, UPDATE, DELETE |
| `supplement_logs` | Nutrition | SELECT, INSERT |
| `saved_meals` | Nutrition | SELECT, INSERT, DELETE |
| `goals` | Goals | SELECT, INSERT, UPDATE |
| `goal_milestones` | Goals | SELECT, INSERT, UPDATE |
| `habits` | Goals | SELECT, INSERT, UPDATE, DELETE |
| `habit_completions` | Goals | SELECT, INSERT |
| `challenge_definitions` | Challenges | SELECT |
| `challenge_enrollments` | Challenges | SELECT, INSERT, UPDATE |
| `challenge_daily_logs` | Challenges | SELECT, INSERT, UPDATE |
| `challenge_tasks` | Challenges | SELECT |
| `mood_logs` | Wellness | SELECT, INSERT |
| `sleep_logs` | Wellness | SELECT, INSERT |
| `businesses` | Business | SELECT, INSERT, UPDATE |
| `revenue_logs` | Business | SELECT, INSERT |
| `expense_logs` | Business | SELECT, INSERT |
| `finance_accounts` | Finance | SELECT, INSERT, UPDATE |
| `finance_transactions` | Finance | SELECT, INSERT |
| `budgets` | Finance | SELECT, INSERT, UPDATE |
| `net_worth_snapshots` | Finance | SELECT, INSERT |
| `ai_chat_conversations` | AI | SELECT, INSERT, UPDATE, DELETE |
| `ai_chat_messages` | AI | SELECT, INSERT |
| `ai_predictions` | AI | SELECT, UPDATE (acknowledge/dismiss) |
| `proactive_messages` | AI | SELECT, UPDATE |
| `lab_uploads` | Labs | SELECT, INSERT |
| `lab_interpretations` | Labs | SELECT, INSERT |
| `biomarkers` | Labs | SELECT |
| `partnerships` | Partner | SELECT, INSERT |
| `partner_nudges` | Partner | SELECT, INSERT |
| `partner_invites` | Partner | SELECT, INSERT, UPDATE |

### Edge Functions (Supabase)
All invoked via `supabase.functions.invoke()`:

| Function | Purpose | Key Inputs |
|----------|---------|-----------|
| `ai-chat-coach` | Conversational AI coach | `conversation_id`, `message`, `topic`, `user_context` |
| `ai-coach` | Morning briefing, evening reflection | `userId`, `type`, `userContext` |
| `workout-narrator` | Real-time workout audio cues | `sessionId`, `exerciseName`, `setNumber`, `context` |
| `ai-form-check` | Video form analysis | `videoUrl`, `exerciseName`, `userContext` |
| `ai-meal-camera` | Meal photo macro estimation | `imageBase64`, `userContext` |
| `ai-meal-prep` | Meal prep planning | `preferences`, `userContext` |
| `ai-supplement` | Supplement recommendations | `currentStack`, `goals`, `userContext` |
| `ai-labs` | Lab result interpretation | `imageBase64`, `labType`, `userContext` |
| `ai-health-roi` | Health decision ROI calculation | `decision`, `metrics`, `userContext` |
| `ai-trajectory` | Weight/goal projections | `historicalData`, `goal`, `userContext` |
| `ai-challenge-coach` | Challenge-specific coaching | `challengeId`, `dayLog`, `userContext` |
| `stripe-webhook` | Payment processing & stakes | `action`, `userId`, `amount`, `stakeId` |

### External REST APIs
| Service | Base URL / Integration | Status |
|---------|----------------------|--------|
| OpenFoodFacts | `https://world.openfoodfacts.org/api/v2` | Working |
| USDA FoodData Central | `https://api.nal.usda.gov/fdc/v1` | Working |
| OpenWeatherMap | API key **not set** in `.env` | Broken |
| Spotify Web API | OAuth via `expo-auth-session` | Partial |
| Strava API | OAuth via `expo-auth-session` | Partial |
| Stripe | `@stripe/stripe-react-native` | Partial |
| Apple Health | `expo-health` / `expo-apple-health-kit` | Partial |
| Google Health Connect | Android health data via RN module | Partial |
| Anthropic Claude API | `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Working |

---

## 6. FEATURES STATUS

### ✅ Working (Core Features)
- **Authentication** — email/password, Google OAuth, Apple Sign-In, session persistence
- **Onboarding** — 9-screen sequential flow
- **Dashboard** — greeting, workouts, weight chart, AI insights, macros, custom widgets
- **Fitness Tracking** — workout sessions, set logging, PR detection, ghost mode, exercise library
- **Nutrition Tracking** — food logging (manual + barcode), macro aggregation, water tracking, meal types
- **Goals** — create/track/progress by 9 categories, milestones, target dates
- **Challenges** — browse templates, enroll, daily task logging, custom challenge creation, leaderboard
- **Habits** — daily tracking, streaks, calendar view
- **Mood & Emotions** — daily log (1-10), energy, stress, motivation, notes
- **Sleep Tracking** — bedtime/wake, quality rating, sleep hygiene, history
- **AI Chat Coach** — multi-topic (8 topics), conversation history, pinning, archive
- **User Profile & Settings** — edit profile, theme toggle, notification preferences, sign out
- **Offline Sync** — queue mutations, auto-sync on reconnect
- **Subscription Tier System** — free/pro/elite/partners tiers, usage tracking, monthly reset
- **Feature Gating** — `useFeatureGate()` hook, upgrade modal

### ⚠️ Partially Working / Stubbed
- **Workout Video Analysis (Form Check)** — screen exists, service defined; video upload + Edge Function not integrated
- **Progress Photos** — structure defined; AI comparison stubbed
- **Meal Camera (AI Photo Analysis)** — service defined; camera + Edge Function not connected
- **Labs / Biomarker Tracking** — upload structure ready; AI parsing not integrated
- **Partner Features (Live Workout Sync)** — invite codes + nudges work; live sync stubbed
- **Business Tracking** — revenue/expense logging ready; metrics aggregation stubbed
- **Finance Tracking** — accounts + transactions ready; advanced analytics stubbed
- **Meal Planning & Prep** — AI service defined; grocery list data flow incomplete
- **Stripe Payments** — partially implemented (stakes/purchases not fully wired)
- **Wearable Integration** — health data sync partial; HRV/recovery not fully integrated
- **Weather Integration** — service defined; API key empty in `.env`
- **Strava / Spotify** — OAuth flow exists; full sync not complete
- **Analytics Service** — event tracking is a stub

### ✗ Not Yet Implemented
- **Geofence Auto-Start** — service defined; native module init stubbed
- **NFC Tags** — setup screen exists; automation triggers not implemented
- **Home Screen Widgets** — registration defined; iOS/Android UI not built
- **Social / Community Sharing** — structure exists; not integrated
- **Workout Program Marketplace** — UI exists; purchase flow not implemented
- **Supplement AI Recommendations** — tracking works; AI recommendations not connected
- **Health ROI Calculator** — screen exists; calculation + visualization stubbed
- **Correlation Analysis** — service defined; analysis engine stubbed
- **Skill Tracking** — screen exists; logging structure not defined
- **Vision Board** — screen exists; image management stubbed
- **Focus Mode (Pomodoro)** — UI ready; session tracking + triggers not implemented
- **Affirmations** — screen exists; daily reminder not scheduled
- **Journal** — screen exists; AI insights not connected
- **Weekly Review / Retrospective** — screen exists; data aggregation not implemented
- **Data Export** — screen exists; CSV/PDF generation not implemented
- **Calendar Sync** — service defined; scheduled sync not complete
- **Apple Watch / Wear OS** — service defined; companion UI not built
- **Voice Commands** — service defined; not integrated

---

## 7. DEPENDENCY INVENTORY

### Mobile App (`apps/mobile/package.json`) — Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~53.0.23 | Core Expo SDK |
| `react` | 19.0.0 | React |
| `react-native` | 0.79.6 | React Native |
| `expo-router` | ~5.1.10 | File-based navigation |
| `zustand` | 4.5.7 | State management |
| `@supabase/supabase-js` | ^2.83.0 | Backend client |
| `@tanstack/react-query` | 5.90.10 | Server state / caching |
| `@stripe/stripe-react-native` | 0.45.0 | Payments |
| `react-native-mmkv` | ^3.0.0 | Fast key-value storage |
| `@react-native-async-storage/async-storage` | 2.1.2 | Auth persistence |
| `react-native-reanimated` | ~3.17.4 | Animations |
| `@shopify/react-native-skia` | v2.0.0-next.4 | Canvas rendering |
| `victory-native` | ^41.20.2 | Charts |
| `lottie-react-native` | 7.2.2 | Lottie animations |
| `react-native-gesture-handler` | ~2.24.0 | Gestures |
| `react-native-svg` | 15.11.2 | SVG support |
| `expo-camera` | ~16.1.0 | Camera |
| `expo-image-picker` | ~16.1.0 | Photo picker |
| `expo-notifications` | ~0.31.0 | Push notifications |
| `expo-location` | ~18.1.0 | Geolocation |
| `expo-av` | ~15.1.0 | Audio/video |
| `expo-speech` | ~13.1.7 | TTS |
| `expo-secure-store` | ~14.2.0 | Secure credential storage |
| `expo-local-authentication` | ~16.0.5 | Biometrics |
| `date-fns` | ^3.6.0 | Date utilities |
| `react-native-draggable-flatlist` | ^4.0.0 | Dashboard builder |

### Expo Plugins (configured in app.json)
- expo-router, expo-camera, expo-image-picker, expo-notifications, expo-location
- expo-local-authentication, expo-secure-store, expo-av, expo-file-system
- stripe-react-native, @react-native-google-signin/google-signin

### Native Permissions Required
**iOS:** Camera, Photo Library, Microphone, Location (when in use + always), Face ID, NFC, Motion, Calendar, Reminders
**Android:** CAMERA, READ/WRITE storage, ACCESS_FINE_LOCATION, RECORD_AUDIO, USE_BIOMETRIC, NFC, INTERNET, RECEIVE_BOOT_COMPLETED

---

## 8. COMPONENT LIBRARY OVERVIEW

### UI Library (`components/ui/`) — 60+ components
- **Layout:** Cards, modals, bottom sheets, safe area wrappers, ambient backgrounds
- **Forms:** Inputs, toggles, pickers, sliders
- **Buttons:** Primary, secondary, ghost, icon, gradient variants
- **Data Display:** Progress rings, progress bars, sparklines, charts (macro rings, weight, sleep, mood, revenue, trajectory)
- **Feedback:** Action toasts, skeletons/loaders, badges, chips, tooltips
- **Premium:** Upgrade overlays, feature lock indicators
- **Help System:** Help bubbles, screen help buttons, coachmarks
- **Animation:** Animated numbers, countdowns, timers, purple radial backgrounds

### Domain Components
- **Fitness:** Workout cards, exercise cards, form check overlay, rest timer, set logger, ghost overlay, narrator card
- **Nutrition:** Macro rings, water tracker, meal cards, food search bar, supplement checklist
- **Challenges:** Challenge cards, progress ring, daily task checklist, calendar view
- **Community:** Leaderboard component, share buttons
- **Partnership:** Partner cards, nudge button, live workout feed
- **Onboarding:** Hero images, background animations

---

## SUMMARY

TRANSFORMR is a comprehensive health & fitness super-app targeting high-performers. Key stats:

| Dimension | Count |
|-----------|-------|
| Screens | 95+ |
| Zustand Stores | 21 |
| Service Files | 50+ |
| Supabase Tables | 35+ |
| Edge Functions | 12 |
| External APIs | 9 |
| Expo SDK | 53 |
| React Native | 0.79.6 |

**Architecture:** React Native + Expo Router → Zustand stores → Supabase (PostgreSQL + Edge Functions + RLS) + Anthropic Claude API

**Core working:** Auth, fitness tracking, nutrition tracking, goals/challenges/habits, mood/sleep, AI chat coach, offline sync, subscription gating

**Partially built:** AI vision features (form check, meal camera, labs), partner live sync, business/finance analytics, wearables, external service integrations

**Not yet built:** Social features, marketplace, data export, widgets, NFC automation, voice commands, most AI analysis features beyond chat
