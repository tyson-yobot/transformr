# TRANSFORMR — Complete Product Blueprint
## The World's Most Complete Life Transformation Platform
### GitHub: tyson-yobot/transformr | Owned by Automate AI LLC

---

## TABLE OF CONTENTS
1. Product Overview
2. Tech Stack & Architecture
3. Infrastructure Setup (GitHub, Supabase, EAS)
4. Database Schema (Complete)
5. All 35 Features — Full Specifications
6. Screen-by-Screen UI Specifications
7. Supabase Edge Functions
8. AI Integration Specifications
9. Seed Data
10. Notification System
11. Deployment & App Store
12. Claude Code Execution Plan

---

## 1. PRODUCT OVERVIEW

**App Name:** TRANSFORMR
**Tagline:** "Every rep. Every meal. Every dollar. Every day."
**Repository:** github.com/tyson-yobot/transformr
**Owner:** Automate AI LLC
**Platform:** iOS + Android (React Native / Expo)
**Backend:** Supabase (new project: transformr-prod)

**What TRANSFORMR is:**
The first all-in-one AI-powered life transformation platform that connects fitness, nutrition, business, finances, habits, mindset, and relationships into a single ecosystem. It replaces your personal trainer, nutritionist, life coach, financial advisor, and accountability partner — all powered by Claude AI.

**Primary Users:**
- User A: Male, 140 lbs → 180 lbs goal, building Automate AI / Construktr, revenue goal $1M, timeline 15–18 months.
- User B (Danyell): Partner with independent fitness, nutrition, and personal goals.
- Future: Public release — anyone pursuing total life transformation.

**Core Countdown:** Configurable primary deadline (e.g., "Nils comes home" ~July–October 2027). All progress measured against this.

**35 Features (Complete List):**
1. AI meal camera — snap food, auto-log macros
2. Ghost mode training — race your past self
3. AI life trajectory simulator — see two futures
4. Couples live sync workout — real-time dual training
5. Body-business correlation engine — health = wealth proof
6. Voice command everything — fully hands-free
7. AI adaptive programming — program rewrites itself
8. AI progress photo analysis — visual body composition
9. Stake goals — put real money on the line
10. Apple Watch companion app
11. AI form check via video
12. Daily readiness score
13. NFC + geofence triggers
14. Auto-generated social content
15. Context-aware motivation engine
16. Live home screen widgets
17. AI smart grocery lists
18. AI sleep optimizer
19. Guided mobility + recovery
20. Community challenges + leaderboards
21. AI vision board + goal cinema
22. Restaurant menu scanner
23. AI workout narrator
24. Deep work focus mode
25. Barcode food scanner
26. Mood-performance correlation
27. Injury prevention + pain tracker
28. Batch cook meal prep planner
29. AI journaling + reflection
30. Spotify workout integration
31. Siri + Google Assistant shortcuts
32. AI supplement advisor
33. Personal finance tracker
34. Drag-and-drop dashboard builder
35. Skill + knowledge tracker

---

## 2. TECH STACK & ARCHITECTURE

### Core Stack (Aligned with Construktr)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20.19.4 |
| Framework | React Native + Expo | SDK 52+ |
| Language | TypeScript | 5.x (strict mode) |
| Navigation | Expo Router | v4+ (file-based) |
| State | Zustand + React Query (TanStack) | Latest |
| Backend | Supabase | Latest |
| Database | PostgreSQL (via Supabase) | 15+ |
| Auth | Supabase Auth (email, Apple, Google) | Latest |
| Realtime | Supabase Realtime | For couples sync |
| Storage | Supabase Storage | Photos, videos |
| Edge Functions | Supabase Edge Functions (Deno) | For AI, crons, webhooks |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Latest |
| Push Notifications | Expo Notifications | Latest |
| Charts | Victory Native + react-native-svg | Latest |
| Local Cache | MMKV + AsyncStorage | Offline-first |
| Camera | expo-camera | Barcode, meal photos, form check |
| Voice | expo-speech + expo-av | Voice commands, narrator |
| Haptics | expo-haptics | PR celebrations, nudges |
| NFC | react-native-nfc-manager | Trigger automations |
| Location | expo-location | Geofence triggers |
| Widgets | react-native-widget-extension | Home screen widgets |
| Watch | react-native-watch-connectivity | Apple Watch |
| Payments | Stripe React Native SDK | Stake goals |
| Music | react-native-spotify-remote | Workout playlists |
| Barcode | expo-camera (barcode scanning) | Food scanning |
| Biometrics | expo-local-authentication | Face ID / fingerprint |
| Secure Storage | expo-secure-store | API keys, tokens |
| Animations | react-native-reanimated 3 | Micro-interactions |
| Gestures | react-native-gesture-handler | Drag-and-drop dashboard |
| Image Picker | expo-image-picker | Progress photos |
| Video | expo-av | Form check recording |
| File System | expo-file-system | Export, caching |
| Sharing | expo-sharing | Social content export |
| CI/CD | EAS Build + EAS Submit | App Store / Play Store |

### Monorepo Structure

```
transformr/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test on PR
│       ├── build-preview.yml         # EAS preview builds
│       └── build-production.yml      # Production builds + submit
├── apps/
│   └── mobile/
│       ├── app/                      # Expo Router (file-based routes)
│       │   ├── _layout.tsx           # Root layout (providers, auth gate)
│       │   ├── index.tsx             # Entry redirect
│       │   ├── (auth)/
│       │   │   ├── _layout.tsx
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   ├── forgot-password.tsx
│       │   │   └── onboarding/
│       │   │       ├── _layout.tsx
│       │   │       ├── welcome.tsx
│       │   │       ├── profile.tsx
│       │   │       ├── goals.tsx
│       │   │       ├── fitness.tsx
│       │   │       ├── nutrition.tsx
│       │   │       ├── business.tsx
│       │   │       ├── partner.tsx
│       │   │       ├── notifications.tsx
│       │   │       └── ready.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx       # Tab navigator
│       │   │   ├── dashboard.tsx     # Main dashboard
│       │   │   ├── fitness/
│       │   │   │   ├── _layout.tsx
│       │   │   │   ├── index.tsx     # Fitness home
│       │   │   │   ├── workout-player.tsx
│       │   │   │   ├── workout-summary.tsx
│       │   │   │   ├── exercises.tsx
│       │   │   │   ├── exercise-detail.tsx
│       │   │   │   ├── progress.tsx
│       │   │   │   ├── programs.tsx
│       │   │   │   ├── form-check.tsx
│       │   │   │   ├── pain-tracker.tsx
│       │   │   │   └── mobility.tsx
│       │   │   ├── nutrition/
│       │   │   │   ├── _layout.tsx
│       │   │   │   ├── index.tsx     # Nutrition home / daily view
│       │   │   │   ├── add-food.tsx
│       │   │   │   ├── meal-camera.tsx
│       │   │   │   ├── barcode-scanner.tsx
│       │   │   │   ├── menu-scanner.tsx
│       │   │   │   ├── saved-meals.tsx
│       │   │   │   ├── meal-plans.tsx
│       │   │   │   ├── meal-prep.tsx
│       │   │   │   ├── grocery-list.tsx
│       │   │   │   ├── supplements.tsx
│       │   │   │   └── analytics.tsx
│       │   │   ├── goals/
│       │   │   │   ├── _layout.tsx
│       │   │   │   ├── index.tsx     # Goals dashboard
│       │   │   │   ├── habits.tsx
│       │   │   │   ├── sleep.tsx
│       │   │   │   ├── mood.tsx
│       │   │   │   ├── journal.tsx
│       │   │   │   ├── focus-mode.tsx
│       │   │   │   ├── vision-board.tsx
│       │   │   │   ├── skills.tsx
│       │   │   │   ├── challenges.tsx
│       │   │   │   ├── stake-goals.tsx
│       │   │   │   ├── business/
│       │   │   │   │   ├── index.tsx
│       │   │   │   │   ├── revenue.tsx
│       │   │   │   │   ├── customers.tsx
│       │   │   │   │   └── milestones.tsx
│       │   │   │   └── finance/
│       │   │   │       ├── index.tsx
│       │   │   │       ├── transactions.tsx
│       │   │   │       ├── budgets.tsx
│       │   │   │       └── net-worth.tsx
│       │   │   └── profile/
│       │   │       ├── _layout.tsx
│       │   │       ├── index.tsx     # Profile & settings
│       │   │       ├── partner.tsx
│       │   │       ├── achievements.tsx
│       │   │       ├── dashboard-builder.tsx
│       │   │       ├── notifications-settings.tsx
│       │   │       ├── nfc-setup.tsx
│       │   │       ├── integrations.tsx  # Spotify, Stripe, Watch
│       │   │       ├── data-export.tsx
│       │   │       └── about.tsx
│       │   ├── partner/
│       │   │   ├── dashboard.tsx
│       │   │   ├── live-workout.tsx
│       │   │   ├── challenges.tsx
│       │   │   └── nudge.tsx
│       │   ├── trajectory.tsx          # AI trajectory simulator
│       │   ├── weekly-review.tsx
│       │   └── goal-cinema.tsx
│       ├── components/
│       │   ├── ui/                    # Design system primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── ProgressRing.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   ├── Slider.tsx
│       │   │   ├── Toggle.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── BottomSheet.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── Toast.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Chip.tsx
│       │   │   ├── Countdown.tsx
│       │   │   ├── Timer.tsx
│       │   │   ├── BodyMap.tsx        # Interactive body for pain/muscle
│       │   │   └── DraggableGrid.tsx  # Dashboard builder
│       │   ├── charts/
│       │   │   ├── WeightChart.tsx
│       │   │   ├── MacroRings.tsx
│       │   │   ├── StreakCalendar.tsx
│       │   │   ├── RevenueChart.tsx
│       │   │   ├── TrajectoryChart.tsx
│       │   │   ├── MoodChart.tsx
│       │   │   ├── SleepChart.tsx
│       │   │   ├── CorrelationChart.tsx
│       │   │   └── Sparkline.tsx
│       │   ├── cards/
│       │   │   ├── CountdownCard.tsx
│       │   │   ├── QuickStatsRow.tsx
│       │   │   ├── TodaysPlanCard.tsx
│       │   │   ├── PartnerCard.tsx
│       │   │   ├── ReadinessCard.tsx
│       │   │   ├── GhostCard.tsx
│       │   │   ├── AchievementCard.tsx
│       │   │   ├── MilestoneCard.tsx
│       │   │   └── WidgetCard.tsx
│       │   ├── workout/
│       │   │   ├── ExerciseCard.tsx
│       │   │   ├── SetLogger.tsx
│       │   │   ├── RestTimer.tsx
│       │   │   ├── GhostOverlay.tsx
│       │   │   ├── PRCelebration.tsx
│       │   │   ├── LiveSyncIndicator.tsx
│       │   │   └── FormCheckRecorder.tsx
│       │   ├── nutrition/
│       │   │   ├── MealCard.tsx
│       │   │   ├── FoodSearchBar.tsx
│       │   │   ├── MacroSummary.tsx
│       │   │   ├── WaterTracker.tsx
│       │   │   ├── SupplementChecklist.tsx
│       │   │   └── MealCameraOverlay.tsx
│       │   └── partner/
│       │       ├── NudgeButton.tsx
│       │       ├── LiveWorkoutFeed.tsx
│       │       └── ChallengeCard.tsx
│       ├── services/
│       │   ├── supabase.ts            # Supabase client init
│       │   ├── ai/
│       │   │   ├── coach.ts           # AI coaching service
│       │   │   ├── mealCamera.ts      # Vision API for food
│       │   │   ├── formCheck.ts       # Vision API for form
│       │   │   ├── menuScanner.ts     # Vision API for menus
│       │   │   ├── progressPhoto.ts   # Vision API for body analysis
│       │   │   ├── narrator.ts        # TTS workout narration
│       │   │   ├── trajectory.ts      # Future projection engine
│       │   │   ├── journaling.ts      # AI journal prompts
│       │   │   ├── motivation.ts      # Personalized motivation
│       │   │   ├── supplement.ts      # Supplement recommendations
│       │   │   ├── correlation.ts     # Body-business correlation
│       │   │   ├── adaptive.ts        # Program auto-adjustment
│       │   │   ├── groceryList.ts     # Smart grocery generation
│       │   │   ├── mealPrep.ts        # Batch cook planning
│       │   │   └── sleepOptimizer.ts  # Sleep recommendations
│       │   ├── notifications.ts       # Push notification management
│       │   ├── nfc.ts                 # NFC trigger management
│       │   ├── geofence.ts            # Location-based triggers
│       │   ├── spotify.ts             # Spotify integration
│       │   ├── stripe.ts              # Stripe for stakes
│       │   ├── watch.ts               # Apple Watch bridge
│       │   ├── voice.ts               # Voice command processing
│       │   ├── barcode.ts             # Barcode lookup (OpenFoodFacts)
│       │   ├── socialContent.ts       # Instagram/TikTok content gen
│       │   ├── widgets.ts             # Home screen widget updates
│       │   └── calculations/
│       │       ├── bmr.ts             # BMR / TDEE calculations
│       │       ├── macros.ts          # Macro target calculations
│       │       ├── streaks.ts         # Streak logic
│       │       ├── readiness.ts       # Readiness score algorithm
│       │       ├── dayScore.ts        # Daily score calculation
│       │       ├── prDetection.ts     # PR detection logic
│       │       └── projections.ts     # Revenue/weight projections
│       ├── stores/
│       │   ├── authStore.ts
│       │   ├── profileStore.ts
│       │   ├── workoutStore.ts
│       │   ├── nutritionStore.ts
│       │   ├── habitStore.ts
│       │   ├── goalStore.ts
│       │   ├── partnerStore.ts
│       │   ├── businessStore.ts
│       │   ├── financeStore.ts
│       │   ├── moodStore.ts
│       │   ├── sleepStore.ts
│       │   ├── dashboardStore.ts
│       │   └── settingsStore.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useProfile.ts
│       │   ├── useWorkout.ts
│       │   ├── useNutrition.ts
│       │   ├── useHabits.ts
│       │   ├── useGoals.ts
│       │   ├── usePartner.ts
│       │   ├── useRealtime.ts         # Supabase realtime subscriptions
│       │   ├── useVoice.ts
│       │   ├── useNFC.ts
│       │   ├── useGeofence.ts
│       │   ├── useReadiness.ts
│       │   ├── useStreaks.ts
│       │   ├── useCountdown.ts
│       │   ├── useDashboardLayout.ts
│       │   └── useOfflineSync.ts
│       ├── utils/
│       │   ├── formatters.ts          # Number, date, currency formatting
│       │   ├── validators.ts          # Input validation
│       │   ├── colors.ts              # Color system
│       │   ├── haptics.ts             # Haptic feedback helpers
│       │   ├── storage.ts             # MMKV helpers
│       │   └── constants.ts           # App-wide constants
│       ├── types/
│       │   ├── database.ts            # Supabase generated types
│       │   ├── navigation.ts          # Route params
│       │   ├── ai.ts                  # AI response types
│       │   └── common.ts              # Shared types
│       ├── theme/
│       │   ├── colors.ts              # Color palette (dark-first)
│       │   ├── spacing.ts             # Spacing scale
│       │   ├── typography.ts          # Font system
│       │   └── index.ts               # Theme provider
│       ├── assets/
│       │   ├── images/
│       │   ├── icons/
│       │   ├── animations/            # Lottie files for celebrations
│       │   └── sounds/                # PR celebration, timer sounds
│       ├── app.json                   # Expo config
│       ├── eas.json                   # EAS Build config
│       ├── tsconfig.json
│       └── package.json
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_partnerships.sql
│   │   ├── 00003_create_countdowns.sql
│   │   ├── 00004_create_fitness_tables.sql
│   │   ├── 00005_create_nutrition_tables.sql
│   │   ├── 00006_create_goals_habits.sql
│   │   ├── 00007_create_sleep_mood.sql
│   │   ├── 00008_create_business_tables.sql
│   │   ├── 00009_create_finance_tables.sql
│   │   ├── 00010_create_achievements.sql
│   │   ├── 00011_create_partner_features.sql
│   │   ├── 00012_create_focus_sessions.sql
│   │   ├── 00013_create_journal.sql
│   │   ├── 00014_create_skills.sql
│   │   ├── 00015_create_nfc_geofence.sql
│   │   ├── 00016_create_dashboard_layouts.sql
│   │   ├── 00017_create_social_content.sql
│   │   ├── 00018_create_stake_goals.sql
│   │   ├── 00019_create_community.sql
│   │   ├── 00020_create_notifications.sql
│   │   ├── 00021_create_rls_policies.sql
│   │   ├── 00022_create_indexes.sql
│   │   └── 00023_create_functions.sql
│   ├── functions/
│   │   ├── ai-coach/index.ts
│   │   ├── ai-meal-analysis/index.ts
│   │   ├── ai-form-check/index.ts
│   │   ├── ai-menu-scan/index.ts
│   │   ├── ai-progress-photo/index.ts
│   │   ├── ai-trajectory/index.ts
│   │   ├── ai-weekly-report/index.ts
│   │   ├── ai-motivation/index.ts
│   │   ├── ai-journal-prompt/index.ts
│   │   ├── ai-supplement/index.ts
│   │   ├── ai-grocery-list/index.ts
│   │   ├── ai-meal-prep/index.ts
│   │   ├── ai-sleep-optimizer/index.ts
│   │   ├── ai-adaptive-program/index.ts
│   │   ├── ai-correlation/index.ts
│   │   ├── daily-reminder/index.ts
│   │   ├── streak-calculator/index.ts
│   │   ├── achievement-evaluator/index.ts
│   │   ├── pr-detection/index.ts
│   │   ├── readiness-score/index.ts
│   │   ├── partner-nudge/index.ts
│   │   ├── stake-evaluator/index.ts
│   │   ├── social-content-gen/index.ts
│   │   ├── goal-cinema/index.ts
│   │   ├── widget-update/index.ts
│   │   └── stripe-webhook/index.ts
│   └── seed.sql
├── watch/                             # Apple Watch companion (WatchOS)
│   └── (WatchKit extension files)
├── widgets/                           # Home screen widget config
│   ├── ios/
│   └── android/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. INFRASTRUCTURE SETUP

### 3.1 GitHub Repository

Claude Code must execute these commands FIRST before any code:

```bash
# Create the repository under tyson-yobot org
gh repo create tyson-yobot/transformr --private --description "TRANSFORMR - AI-Powered Life Transformation Platform" --clone

cd transformr

# Set up branch strategy
git checkout -b dev
git push -u origin dev

# Set dev as default branch for development
gh repo edit tyson-yobot/transformr --default-branch dev

# Create branch protection on main
gh api repos/tyson-yobot/transformr/branches/main/protection -X PUT -f '{"required_pull_request_reviews":{"required_approving_review_count":1},"enforce_admins":false,"required_status_checks":null,"restrictions":null}'

# Set up labels
gh label create "feature" --color "0E8A16" --description "New feature"
gh label create "bug" --color "D73A4A" --description "Bug fix"
gh label create "ai" --color "7057FF" --description "AI/ML related"
gh label create "fitness" --color "FBCA04" --description "Fitness module"
gh label create "nutrition" --color "0075CA" --description "Nutrition module"
gh label create "business" --color "E4E669" --description "Business module"
gh label create "partner" --color "D876E3" --description "Partner/couples features"
```

### 3.2 Supabase Project

```bash
# Install Supabase CLI if not present
npm install -g supabase

# Login to Supabase
supabase login

# Create new project
supabase projects create transformr-prod --org-id <YOUR_ORG_ID> --db-password <GENERATE_SECURE_PASSWORD> --region us-west-1

# Link local to remote
supabase link --project-ref <PROJECT_REF>

# Initialize local supabase
supabase init
```

**Required Supabase Configuration:**
- Enable Auth providers: Email/Password, Apple, Google
- Enable Realtime on tables: workout_sessions, workout_sets, partner_nudges, live_workout_sync
- Create Storage buckets: progress-photos, form-check-videos, meal-photos, avatars, vision-board, social-content
- Set up Edge Function secrets:
  - ANTHROPIC_API_KEY
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - SPOTIFY_CLIENT_ID
  - SPOTIFY_CLIENT_SECRET
  - EXPO_PUSH_TOKEN
  - OPEN_FOOD_FACTS_API (public, no key needed)

### 3.3 Expo / EAS Setup

```bash
# Create Expo project
npx create-expo-app transformr --template expo-template-blank-typescript

cd transformr

# Install ALL dependencies
npx expo install expo-router expo-notifications expo-camera expo-image-picker \
  expo-haptics expo-av expo-speech expo-local-authentication expo-secure-store \
  expo-file-system expo-sharing expo-location expo-linking expo-constants \
  react-native-reanimated react-native-gesture-handler react-native-svg \
  react-native-safe-area-context react-native-screens \
  @react-native-async-storage/async-storage

npm install @supabase/supabase-js zustand @tanstack/react-query \
  victory-native react-native-mmkv react-native-nfc-manager \
  react-native-watch-connectivity @stripe/stripe-react-native \
  react-native-spotify-remote date-fns lodash uuid \
  react-native-draggable-flatlist lottie-react-native \
  react-native-widget-extension

npm install -D @types/lodash @types/uuid typescript @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin eslint prettier

# Configure EAS
npx eas-cli init
npx eas-cli build:configure

# Node version enforcement
echo "20.19.4" > .nvmrc
```

**eas.json:**
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "NODE_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "NODE_ENV": "preview" }
    },
    "production": {
      "env": { "NODE_ENV": "production" },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "<APPLE_ID>", "ascAppId": "<ASC_APP_ID>" },
      "android": { "serviceAccountKeyPath": "<PATH_TO_KEY>" }
    }
  }
}
```

### 3.4 Environment Variables

**.env.example:**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
EXPO_PUBLIC_ANTHROPIC_API_KEY=xxxxx
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=xxxxx
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=xxxxx
EXPO_PUBLIC_OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v2
```

---

## 4. DATABASE SCHEMA (COMPLETE)

### 4.1 Core — Users, Partners, Countdowns

```sql
-- ==========================================
-- MIGRATION 00001: PROFILES
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_inches NUMERIC,
  current_weight NUMERIC,
  goal_weight NUMERIC,
  goal_direction TEXT CHECK (goal_direction IN ('gain', 'lose', 'maintain')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
  daily_calorie_target INTEGER,
  daily_protein_target INTEGER,
  daily_carb_target INTEGER,
  daily_fat_target INTEGER,
  daily_water_target_oz INTEGER DEFAULT 100,
  timezone TEXT DEFAULT 'America/Phoenix',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  notification_preferences JSONB DEFAULT '{
    "wake_up": {"enabled": true, "time": "07:00"},
    "meals": {"enabled": true, "times": ["08:00","12:00","15:00","18:00","21:00"]},
    "gym": {"enabled": true, "time": "09:00"},
    "sleep": {"enabled": true, "time": "23:00"},
    "water": {"enabled": true, "interval_minutes": 60},
    "daily_checkin": {"enabled": true, "time": "22:00"},
    "weekly_review": {"enabled": true, "day": "sunday", "time": "10:00"},
    "focus_reminder": {"enabled": true, "time": "10:00"},
    "supplement": {"enabled": true},
    "partner_activity": {"enabled": true}
  }'::jsonb,
  voice_commands_enabled BOOLEAN DEFAULT true,
  narrator_enabled BOOLEAN DEFAULT false,
  narrator_voice TEXT DEFAULT 'default',
  spotify_connected BOOLEAN DEFAULT false,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  stripe_customer_id TEXT,
  watch_paired BOOLEAN DEFAULT false,
  expo_push_token TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- MIGRATION 00002: PARTNERSHIPS
-- ==========================================
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','active','paused','ended')) DEFAULT 'pending',
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  shared_preferences JSONB DEFAULT '{
    "can_see_weight": true,
    "can_see_workouts": true,
    "can_see_nutrition": true,
    "can_see_habits": true,
    "can_see_goals": true,
    "can_see_mood": false,
    "can_see_journal": false,
    "can_see_business": false,
    "can_see_finance": false,
    "can_nudge": true,
    "can_challenge": true,
    "live_sync_enabled": true
  }'::jsonb,
  joint_streak INTEGER DEFAULT 0,
  longest_joint_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- ==========================================
-- MIGRATION 00003: COUNTDOWNS
-- ==========================================
CREATE TABLE countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  emoji TEXT DEFAULT '🎯',
  is_primary BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6366F1',
  linked_goal_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Fitness Module

```sql
-- ==========================================
-- MIGRATION 00004: FITNESS TABLES
-- ==========================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('chest','back','shoulders','biceps','triceps','legs','glutes','abs','cardio','compound','olympic','stretching','mobility')),
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT CHECK (equipment IN ('barbell','dumbbell','cable','machine','bodyweight','kettlebell','bands','smith_machine','trx','other')),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  instructions TEXT,
  tips TEXT,
  common_mistakes TEXT,
  video_url TEXT,
  image_url TEXT,
  is_compound BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  body_fat_percentage NUMERIC,
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  ai_body_analysis JSONB,              -- AI photo analysis results
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chest NUMERIC, waist NUMERIC, hips NUMERIC,
  bicep_left NUMERIC, bicep_right NUMERIC,
  thigh_left NUMERIC, thigh_right NUMERIC,
  calf_left NUMERIC, calf_right NUMERIC,
  neck NUMERIC, shoulders NUMERIC,
  forearm_left NUMERIC, forearm_right NUMERIC,
  measured_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  day_of_week INTEGER,
  estimated_duration_minutes INTEGER,
  is_shared BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_last_adjusted_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sort_order INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps TEXT,
  target_weight NUMERIC,
  target_rpe NUMERIC,
  rest_seconds INTEGER DEFAULT 90,
  superset_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume NUMERIC,                 -- Auto-calculated sum of weight × reps
  total_sets INTEGER,
  notes TEXT,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  readiness_score INTEGER,
  is_with_partner BOOLEAN DEFAULT false,
  is_live_sync BOOLEAN DEFAULT false,
  partner_session_id UUID,              -- Linked partner session for live sync
  spotify_playlist_id TEXT,
  form_check_video_url TEXT,
  ai_form_feedback JSONB,
  mobility_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight NUMERIC,
  duration_seconds INTEGER,
  distance NUMERIC,
  is_warmup BOOLEAN DEFAULT false,
  is_dropset BOOLEAN DEFAULT false,
  is_failure BOOLEAN DEFAULT false,
  is_personal_record BOOLEAN DEFAULT false,
  rpe NUMERIC,
  ghost_weight NUMERIC,                 -- Previous session's weight for ghost mode
  ghost_reps INTEGER,                   -- Previous session's reps for ghost mode
  ghost_beaten BOOLEAN,                 -- Did user beat the ghost?
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  record_type TEXT CHECK (record_type IN ('max_weight','max_reps','max_volume','max_duration','max_1rm')),
  value NUMERIC NOT NULL,
  previous_record NUMERIC,
  workout_session_id UUID REFERENCES workout_sessions(id),
  achieved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Live workout sync (real-time couples)
CREATE TABLE live_workout_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id),
  exercise_name TEXT,
  set_number INTEGER,
  reps INTEGER,
  weight NUMERIC,
  status TEXT CHECK (status IN ('resting','active','completed')),
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Pain / injury tracking
CREATE TABLE pain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL,              -- 'left_shoulder', 'lower_back', etc.
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
  pain_type TEXT CHECK (pain_type IN ('sharp','dull','aching','burning','tingling','stiffness')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- Mobility / recovery sessions
CREATE TABLE mobility_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_muscles TEXT[] NOT NULL,
  duration_minutes INTEGER,
  exercises_completed JSONB,            -- [{name, duration_seconds, notes}]
  post_workout_session_id UUID REFERENCES workout_sessions(id),
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Nutrition Module

```sql
-- ==========================================
-- MIGRATION 00005: NUTRITION TABLES
-- ==========================================

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  serving_size NUMERIC NOT NULL,
  serving_unit TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC, sugar NUMERIC, sodium NUMERIC,
  saturated_fat NUMERIC, trans_fat NUMERIC,
  cholesterol NUMERIC, potassium NUMERIC,
  barcode TEXT,
  open_food_facts_id TEXT,
  image_url TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','shake','pre_workout','post_workout')),
  is_shared BOOLEAN DEFAULT false,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  prep_time_minutes INTEGER,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id UUID REFERENCES saved_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  saved_meal_id UUID REFERENCES saved_meals(id),
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','shake','pre_workout','post_workout')),
  quantity NUMERIC NOT NULL DEFAULT 1,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  source TEXT CHECK (source IN ('manual','camera','barcode','voice','saved_meal','menu_scan')) DEFAULT 'manual',
  photo_url TEXT,
  ai_confidence NUMERIC,               -- AI meal camera confidence score
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_oz NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  times TEXT[],
  category TEXT CHECK (category IN ('protein','creatine','vitamin','mineral','amino_acid','pre_workout','post_workout','sleep','other')),
  is_ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT now()
);

-- Meal prep plans
CREATE TABLE meal_prep_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id),  -- Couples meal prep
  week_start DATE NOT NULL,
  total_prep_time_minutes INTEGER,
  grocery_list JSONB,                   -- [{item, quantity, unit, aisle, estimated_cost}]
  total_estimated_cost NUMERIC,
  meals JSONB,                          -- [{meal_id, day, meal_type, servings_user_a, servings_user_b}]
  prep_instructions JSONB,             -- [{step, description, duration_minutes}]
  container_plan JSONB,                -- [{container_label, contents, macros}]
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grocery lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_prep_plan_id UUID REFERENCES meal_prep_plans(id),
  week_start DATE,
  items JSONB NOT NULL,                 -- [{name, quantity, unit, aisle, checked, estimated_cost}]
  total_estimated_cost NUMERIC,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 Goals, Habits, Sleep, Mood, Journal

```sql
-- ==========================================
-- MIGRATION 00006: GOALS & HABITS
-- ==========================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','business','financial','personal','relationship','education','health','mindset')),
  goal_type TEXT CHECK (goal_type IN ('target','habit','milestone','project')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  countdown_id UUID REFERENCES countdowns(id),
  status TEXT CHECK (status IN ('active','completed','paused','abandoned')) DEFAULT 'active',
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 5),
  color TEXT,
  icon TEXT,
  is_staked BOOLEAN DEFAULT false,
  stake_amount NUMERIC,
  stake_charity TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  celebration_message TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','business','health','personal','mindset','finance','learning')),
  frequency TEXT CHECK (frequency IN ('daily','weekdays','weekends','custom')),
  custom_days INTEGER[],
  target_count INTEGER DEFAULT 1,
  unit TEXT,
  reminder_time TIME,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_shields INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completed_count INTEGER DEFAULT 1,
  value NUMERIC,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00007: SLEEP & MOOD
-- ==========================================

CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bedtime TIMESTAMPTZ NOT NULL,
  wake_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (wake_time - bedtime)) / 60
  ) STORED,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  caffeine_cutoff_time TIME,           -- When they stopped caffeine
  screen_cutoff_time TIME,             -- When they stopped screens
  notes TEXT,
  ai_sleep_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  stress INTEGER CHECK (stress BETWEEN 1 AND 10),
  motivation INTEGER CHECK (motivation BETWEEN 1 AND 10),
  context TEXT CHECK (context IN ('morning','midday','afternoon','evening','post_workout','post_meal')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score BETWEEN 1 AND 100),
  sleep_component INTEGER,
  soreness_component INTEGER,
  stress_component INTEGER,
  energy_component INTEGER,
  training_load_component INTEGER,
  recommendation TEXT CHECK (recommendation IN ('go_hard','moderate','light','rest')),
  ai_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
```

### 4.5 Business & Finance

```sql
-- ==========================================
-- MIGRATION 00008: BUSINESS TABLES
-- ==========================================

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('saas','service','product','consulting','other')),
  valuation NUMERIC,
  monthly_revenue NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  logo_url TEXT,
  stripe_account_id TEXT,
  stripe_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE revenue_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('subscription','one_time','consulting','affiliate','other')),
  source TEXT DEFAULT 'manual',
  customer_name TEXT,
  description TEXT,
  stripe_payment_id TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT CHECK (category IN ('infrastructure','marketing','tools','payroll','legal','contractors','office','travel','other')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  plan_tier TEXT,
  mrr NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('trial','active','churned','paused')) DEFAULT 'trial',
  started_at DATE,
  churned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_metric TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  target_date DATE,
  celebration_message TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00009: PERSONAL FINANCE
-- ==========================================

CREATE TABLE finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                   -- "Chase Checking", "Robinhood", "Bitcoin Wallet"
  type TEXT CHECK (type IN ('checking','savings','credit_card','investment','crypto','cash','other')),
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,             -- Positive = income, Negative = expense
  category TEXT CHECK (category IN ('income','food','housing','transportation','entertainment','health','education','shopping','subscriptions','savings','investment','business_income','other')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  current_spent NUMERIC DEFAULT 0,
  month DATE NOT NULL,                  -- First of the month
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, month)
);

CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_assets NUMERIC,
  total_liabilities NUMERIC,
  net_worth NUMERIC,
  business_equity NUMERIC,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 Journal, Focus, Skills, Vision Board

```sql
-- ==========================================
-- MIGRATION 00012: FOCUS SESSIONS
-- ==========================================

CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_description TEXT,
  category TEXT CHECK (category IN ('coding','business','marketing','learning','admin','creative','other')),
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  distractions_count INTEGER DEFAULT 0,
  productivity_rating INTEGER CHECK (productivity_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00013: JOURNAL
-- ==========================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_prompt TEXT,                       -- AI-generated writing prompt
  entry_text TEXT,                      -- User's journal entry
  wins TEXT[],
  struggles TEXT[],
  gratitude TEXT[],
  tomorrow_focus TEXT[],
  ai_response TEXT,                     -- AI coaching response
  ai_patterns_detected JSONB,          -- AI-detected patterns
  mood_at_entry INTEGER CHECK (mood_at_entry BETWEEN 1 AND 10),
  tags TEXT[],
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Monthly AI-generated letters
CREATE TABLE monthly_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  letter_text TEXT NOT NULL,
  highlights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- ==========================================
-- MIGRATION 00014: SKILLS & KNOWLEDGE
-- ==========================================

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical','business','fitness','nutrition','language','creative','leadership','other')),
  proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 10),
  target_proficiency INTEGER CHECK (target_proficiency BETWEEN 1 AND 10),
  hours_practiced NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  status TEXT CHECK (status IN ('want_to_read','reading','completed','abandoned')) DEFAULT 'want_to_read',
  pages_total INTEGER,
  pages_read INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  key_takeaways TEXT[],
  ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT,                        -- "Udemy", "Coursera", etc.
  category TEXT,
  url TEXT,
  progress_percent INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('planned','in_progress','completed','abandoned')) DEFAULT 'planned',
  certificate_url TEXT,
  notes TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.7 Partner, Community, NFC, Dashboard, Achievements

```sql
-- ==========================================
-- MIGRATION 00011: PARTNER FEATURES
-- ==========================================

CREATE TABLE partner_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('encouragement','reminder','celebration','challenge','reaction')),
  message TEXT,
  emoji TEXT,
  reaction_to TEXT,                     -- What activity prompted this
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE partner_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('both_complete','competition','streak','custom')),
  metric TEXT,                          -- 'workouts', 'calories', 'steps', etc.
  target_value NUMERIC,
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  user_a_progress NUMERIC DEFAULT 0,
  user_b_progress NUMERIC DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  stake_amount NUMERIC,
  status TEXT CHECK (status IN ('active','completed','expired')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00015: NFC & GEOFENCE
-- ==========================================

CREATE TABLE nfc_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,                 -- NFC tag unique ID
  label TEXT NOT NULL,                  -- "Gym Bag", "Fridge", "Nightstand"
  action TEXT NOT NULL,                 -- "start_workout", "open_meal_log", "start_sleep"
  action_params JSONB,                 -- Additional params for the action
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE geofence_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                  -- "My Gym", "Office", "Home"
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  trigger_on TEXT CHECK (trigger_on IN ('enter','exit','both')) DEFAULT 'enter',
  action TEXT NOT NULL,
  action_params JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00016: DASHBOARD LAYOUTS
-- ==========================================

CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  layout JSONB NOT NULL,               -- [{widget_type, position: {x, y, w, h}, config: {}}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Available widgets: countdown, weight_chart, macro_rings, streak_counter,
-- revenue_chart, partner_card, readiness_score, focus_timer, habit_checklist,
-- sleep_summary, mood_trend, pr_list, water_tracker, motivation_quote,
-- todays_workout, todays_plan, weekly_progress, goal_progress, sparkline_weight,
-- sparkline_calories, sparkline_revenue, skill_progress, book_progress,
-- net_worth_card, body_business_correlation

-- ==========================================
-- MIGRATION 00017: SOCIAL CONTENT
-- ==========================================

CREATE TABLE social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('transformation','weekly_recap','pr_celebration','milestone','time_lapse','custom')),
  template TEXT,
  content_data JSONB,                   -- Data used to generate the content
  image_url TEXT,
  video_url TEXT,
  caption TEXT,
  platform TEXT,                        -- 'instagram', 'tiktok', 'twitter'
  is_shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00018: STAKE GOALS
-- ==========================================

CREATE TABLE stake_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stake_amount NUMERIC NOT NULL,
  evaluation_frequency TEXT CHECK (evaluation_frequency IN ('daily','weekly','monthly')),
  charity_name TEXT,
  charity_url TEXT,
  partner_receives BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  evaluation_criteria JSONB,            -- What constitutes pass/fail
  total_lost NUMERIC DEFAULT 0,
  total_saved NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stake_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_goal_id UUID REFERENCES stake_goals(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  passed BOOLEAN NOT NULL,
  evaluation_data JSONB,               -- What data was checked
  amount_at_risk NUMERIC,
  amount_charged NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00019: COMMUNITY
-- ==========================================

CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  metric TEXT,
  target_value NUMERIC,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_progress NUMERIC DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE community_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('consistency','volume','streaks','prs','overall')),
  score NUMERIC DEFAULT 0,
  rank INTEGER,
  period TEXT CHECK (period IN ('weekly','monthly','all_time')),
  period_start DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00010: ACHIEVEMENTS
-- ==========================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','body','business','finance','consistency','partner','community','mindset','learning')),
  tier TEXT CHECK (tier IN ('bronze','silver','gold','diamond')),
  requirement_type TEXT,
  requirement_value NUMERIC,
  secret BOOLEAN DEFAULT false,        -- Hidden achievements
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ==========================================
-- MIGRATION 00020: NOTIFICATIONS
-- ==========================================

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00021: DAILY CHECK-INS & WEEKLY REVIEWS
-- ==========================================

CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_score NUMERIC,
  habits_completed INTEGER,
  habits_total INTEGER,
  calories_logged NUMERIC,
  protein_logged NUMERIC,
  workouts_completed INTEGER,
  sleep_hours NUMERIC,
  focus_hours NUMERIC,
  revenue_logged NUMERIC,
  water_oz NUMERIC,
  mood_average NUMERIC,
  ai_morning_briefing TEXT,
  ai_evening_reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  weight_change NUMERIC,
  workouts_completed INTEGER,
  workouts_target INTEGER,
  avg_calories NUMERIC,
  avg_protein NUMERIC,
  avg_sleep_hours NUMERIC,
  avg_mood NUMERIC,
  avg_readiness NUMERIC,
  habits_completion_rate NUMERIC,
  focus_hours_total NUMERIC,
  revenue_this_week NUMERIC,
  cumulative_revenue NUMERIC,
  new_customers INTEGER,
  prs_this_week INTEGER,
  top_wins TEXT[],
  areas_to_improve TEXT[],
  next_week_goals TEXT[],
  ai_weekly_summary TEXT,
  fitness_grade TEXT,
  nutrition_grade TEXT,
  business_grade TEXT,
  habits_grade TEXT,
  sleep_grade TEXT,
  overall_grade TEXT,
  body_business_correlations JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Vision board
CREATE TABLE vision_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  category TEXT CHECK (category IN ('body','business','lifestyle','relationship','material','travel','personal')),
  linked_goal_id UUID REFERENCES goals(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- MIGRATION 00022: INDEXES
-- ==========================================

CREATE INDEX idx_weight_user_date ON weight_logs(user_id, logged_at DESC);
CREATE INDEX idx_nutrition_user_date ON nutrition_logs(user_id, logged_at DESC);
CREATE INDEX idx_workout_user_date ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_habit_comp_user_date ON habit_completions(user_id, completed_at DESC);
CREATE INDEX idx_sleep_user_date ON sleep_logs(user_id, bedtime DESC);
CREATE INDEX idx_mood_user_date ON mood_logs(user_id, logged_at DESC);
CREATE INDEX idx_revenue_biz_date ON revenue_logs(business_id, transaction_date DESC);
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date DESC);
CREATE INDEX idx_focus_user_date ON focus_sessions(user_id, started_at DESC);
CREATE INDEX idx_finance_tx_user_date ON finance_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_pain_user_date ON pain_logs(user_id, logged_at DESC);
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX idx_exercises_name ON exercises USING gin(to_tsvector('english', name));
CREATE INDEX idx_live_sync_session ON live_workout_sync(session_id, synced_at DESC);
```

### 4.8 Row Level Security (All Tables)

```sql
-- ==========================================
-- MIGRATION 00021: RLS POLICIES
-- ==========================================

-- Apply RLS to ALL tables (abbreviated — apply this pattern to every table)
-- Pattern: own data + partner data where partnership allows

-- Helper function: check if users are partners
CREATE OR REPLACE FUNCTION is_partner(check_user UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM partnerships
    WHERE status = 'active'
    AND ((user_a = auth.uid() AND user_b = check_user)
      OR (user_b = auth.uid() AND user_a = check_user))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to each table: profiles, weight_logs, nutrition_logs, workout_sessions,
-- workout_sets, habit_completions, sleep_logs, mood_logs, goals, etc.
-- Each table gets: SELECT own + partner, INSERT own, UPDATE own, DELETE own
```

---

## 5. DESIGN SYSTEM

### Color Palette (Dark-First)

```typescript
export const colors = {
  // Dark theme (default)
  dark: {
    background: {
      primary: '#0F172A',      // Main bg
      secondary: '#1E293B',    // Cards, surfaces
      tertiary: '#334155',     // Elevated
      input: '#1E293B',        // Form inputs
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
      inverse: '#0F172A',
    },
    accent: {
      primary: '#6366F1',      // Indigo — main actions
      secondary: '#8B5CF6',    // Violet — partner features
      success: '#22C55E',      // Green — completed, gains
      warning: '#F59E0B',      // Amber — attention
      danger: '#EF4444',       // Red — missed, broken
      info: '#3B82F6',         // Blue — informational
      fire: '#F97316',         // Orange — streaks
      gold: '#EAB308',         // Gold — achievements
      pink: '#EC4899',         // Pink — partner/love
    },
    border: {
      default: '#334155',
      subtle: '#1E293B',
      focus: '#6366F1',
    },
  },
  // Light theme
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      input: '#F8FAFC',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#F8FAFC',
    },
    // Same accent colors work for both themes
  },
};
```

### Typography

```typescript
export const typography = {
  hero: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  stat: { fontSize: 28, fontWeight: '700', fontFamily: 'SF Mono' },
  statSmall: { fontSize: 20, fontWeight: '600', fontFamily: 'SF Mono' },
  tiny: { fontSize: 11, fontWeight: '500', lineHeight: 14 },
};
```

### Spacing Scale

```typescript
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};
export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
};
```

---

## 6. CLAUDE CODE EXECUTION PLAN

### PHASE 1 — Infrastructure (Day 1)
```
Step 1: Create GitHub repo (tyson-yobot/transformr)
Step 2: Create Supabase project (transformr-prod)
Step 3: Initialize Expo project with TypeScript
Step 4: Install ALL dependencies (see tech stack)
Step 5: Set up project structure (all directories)
Step 6: Configure ESLint, Prettier, TypeScript strict
Step 7: Set up .env with Supabase credentials
Step 8: Run all database migrations
Step 9: Seed exercise database (100+ exercises)
Step 10: Seed food database (100+ foods)
Step 11: Seed achievement definitions (75+ achievements)
Step 12: Seed workout program templates
Step 13: Configure EAS for builds
Step 14: Initial commit + push to dev branch
```

### PHASE 2 — Design System + Auth (Days 2-3)
```
Step 15: Build complete design system (colors, typography, spacing)
Step 16: Build all UI primitives (Button, Card, Input, Modal, etc.)
Step 17: Build chart components (WeightChart, MacroRings, etc.)
Step 18: Implement Supabase Auth (email, Apple, Google)
Step 19: Build auth screens (login, register, forgot password)
Step 20: Build complete onboarding flow (9 screens)
Step 21: Set up navigation structure (tabs + stacks)
Step 22: Build auth gate + protected routes
```

### PHASE 3 — Core Fitness (Days 4-6)
```
Step 23: Dashboard screen with countdown + quick stats
Step 24: Weight logging + weight chart
Step 25: Exercise library with search + filters
Step 26: Workout templates + program manager
Step 27: Workout player (sets, reps, weight, rest timer)
Step 28: Ghost mode overlay in workout player
Step 29: PR auto-detection + celebration animation
Step 30: Workout summary screen
Step 31: Progress screen (weight, measurements, photos)
Step 32: Body measurements logging
Step 33: Pain tracker with interactive body map
Step 34: Mobility/recovery session generator
```

### PHASE 4 — Core Nutrition (Days 7-9)
```
Step 35: Nutrition home / daily macro view
Step 36: Food search + manual add
Step 37: Saved meals system
Step 38: Water tracker
Step 39: Supplement tracker + checklist
Step 40: AI meal camera (Claude Vision)
Step 41: Barcode scanner (expo-camera + OpenFoodFacts)
Step 42: Restaurant menu scanner (Claude Vision)
Step 43: Meal prep planner
Step 44: AI grocery list generator
Step 45: Nutrition analytics screen
```

### PHASE 5 — Goals, Habits, Routine (Days 10-12)
```
Step 46: Goals dashboard + goal detail
Step 47: Habit tracker with streak chain
Step 48: Habit completion + streak calendar heatmap
Step 49: Sleep tracker + sleep analytics
Step 50: Mood logger + mood trend chart
Step 51: Daily readiness score calculator
Step 52: Focus mode / deep work timer (Pomodoro)
Step 53: AI journal + reflection prompts
Step 54: Daily check-in system
Step 55: Weekly review generator
Step 56: Skill tracker (books, courses)
Step 57: Vision board builder
```

### PHASE 6 — Business + Finance (Days 13-14)
```
Step 58: Business dashboard (MRR, ARR, customers)
Step 59: Revenue logging + revenue chart
Step 60: Customer tracker
Step 61: Business milestones
Step 62: Personal finance — accounts + transactions
Step 63: Budget tracker
Step 64: Net worth tracker + snapshots
Step 65: Stripe webhook for auto revenue tracking
```

### PHASE 7 — AI Intelligence Layer (Days 15-18)
```
Step 66: AI coaching Edge Function (daily briefing)
Step 67: AI motivation engine (context-aware)
Step 68: AI adaptive programming (auto-adjust workouts)
Step 69: AI trajectory simulator (two futures)
Step 70: AI body-business correlation engine
Step 71: AI progress photo analysis (Claude Vision)
Step 72: AI form check via video (Claude Vision)
Step 73: AI sleep optimizer
Step 74: AI supplement advisor
Step 75: AI workout narrator (TTS)
Step 76: AI meal prep optimizer
Step 77: Monthly AI letter generator
Step 78: Goal Cinema auto-generated video
```

### PHASE 8 — Partner / Couples (Days 19-21)
```
Step 79: Partner linking (invite code system)
Step 80: Partner dashboard (side-by-side stats)
Step 81: Nudge system (pre-built + custom messages)
Step 82: Couples live sync workout (Supabase Realtime)
Step 83: Partner challenges
Step 84: Joint streak tracking
Step 85: Partner activity feed
Step 86: Emoji reactions to partner activities
```

### PHASE 9 — Community + Social (Days 22-23)
```
Step 87: Community challenges + leaderboards
Step 88: Social content auto-generator
Step 89: Transformation time-lapse video
Step 90: Stake goals (Stripe integration)
Step 91: Stake evaluation system
```

### PHASE 10 — Voice, NFC, Widgets, Watch (Days 24-26)
```
Step 92: Voice command processor (natural language → actions)
Step 93: NFC trigger setup + management
Step 94: Geofence trigger setup + management
Step 95: iOS home screen widgets (countdown, macros, streak)
Step 96: Android home screen widgets
Step 97: Lock screen widgets
Step 98: Siri Shortcuts integration
Step 99: Apple Watch companion (set logging, rest timer, macros)
Step 100: Spotify workout playlist integration
```

### PHASE 11 — Dashboard Builder + Polish (Days 27-28)
```
Step 101: Drag-and-drop dashboard builder
Step 102: Widget library (all available widgets)
Step 103: Dashboard layout save/load
Step 104: Dark/light mode toggle
Step 105: All animations + haptic feedback
Step 106: Skeleton loading states (every screen)
Step 107: Offline-first data caching (MMKV)
Step 108: Offline sync queue
Step 109: Error boundaries + graceful failures
Step 110: Data export (CSV, JSON, PDF report)
```

### PHASE 12 — Notifications + Automation (Days 29-30)
```
Step 111: Push notification service setup
Step 112: Scheduled notifications (meals, gym, sleep, water)
Step 113: Smart notifications (contextual, data-driven)
Step 114: Streak protection alerts
Step 115: PR alerts + partner notifications
Step 116: Weekly review push notification
Step 117: Streak calculator cron job
Step 118: Achievement evaluator cron job
Step 119: Auto-update calorie targets on weight change
Step 120: All Edge Function deployments
```

### PHASE 13 — Testing + Launch (Days 31-35)
```
Step 121: Unit tests — calculations (BMR, macros, streaks, PRs, readiness)
Step 122: Unit tests — AI prompt builders
Step 123: Integration tests — auth flow
Step 124: Integration tests — workout logging flow
Step 125: Integration tests — nutrition logging flow
Step 126: E2E tests — critical user journeys
Step 127: Accessibility audit (VoiceOver, Dynamic Type, touch targets)
Step 128: Performance optimization (lazy loading, memo, virtualized lists)
Step 129: App Store screenshots + preview video
Step 130: App Store listing copy
Step 131: Privacy policy + terms of service
Step 132: EAS production build (iOS + Android)
Step 133: TestFlight + Google Play internal testing
Step 134: App Store + Google Play submission
Step 135: Production deployment + monitoring setup
```

---

## 7. CRITICAL IMPLEMENTATION NOTES

1. **Node 20.19.4** — Enforce via .nvmrc and engines field in package.json
2. **TypeScript strict mode** — No `any` types. Full type safety.
3. **Offline-first** — Workout logging, meal logging, habit tracking MUST work without internet. Queue syncs when connection returns.
4. **Speed** — Logging a food item or workout set must take < 3 seconds and < 3 taps.
5. **No stubs** — Every feature fully implemented. No placeholder screens. No "coming soon."
6. **AI context** — Every Claude API call includes: user's goals, last 7 days of data, current countdown, preferences. Context is everything.
7. **Haptic feedback** — PR celebrations, achievement unlocks, streak milestones, partner nudges, milestone completions all trigger haptics.
8. **Animations** — Use react-native-reanimated for all transitions. Spring physics for interactive elements. Lottie for celebrations.
9. **Error handling** — Never crash on network errors. Show cached data + sync indicator. Retry with exponential backoff.
10. **Data validation** — Validate all inputs client-side AND server-side. Handle timezone edge cases.
11. **Security** — All API keys in expo-secure-store. RLS on every table. Biometric auth option.
12. **Accessibility** — VoiceOver labels on all interactive elements. Minimum 44pt touch targets. Dynamic Type support.
13. **Align with Construktr** — Match file structure patterns, naming conventions, component patterns, and code style from the Construktr codebase.

---

## 8. APP STORE LISTING

**App Name:** TRANSFORMR — AI Life Coach
**Subtitle:** Fitness • Nutrition • Business • Habits
**Category:** Health & Fitness
**Age Rating:** 4+
**Price:** Free (premium features via future subscription)

**Description:**
TRANSFORMR is the world's first AI-powered total life transformation platform. Track your fitness, nutrition, business revenue, personal finances, habits, sleep, mood, and personal growth — all in one app, all connected by artificial intelligence.

Features no other app has: AI meal camera that logs food from a photo. Ghost mode training to race your past self. AI form check that analyzes your exercise technique. Live couples workout sync. Body-business correlation proving health equals wealth. Voice commands for hands-free everything. And 29 more features that make every other fitness app obsolete.

Whether you're gaining muscle, building a business, or transforming your entire life — TRANSFORMR is your AI-powered coach, trainer, nutritionist, and accountability partner.

**Keywords:** fitness, AI coach, workout tracker, nutrition, couples fitness, habit tracker, business goals, meal prep, body transformation, accountability

---

*This blueprint contains everything needed to build TRANSFORMR from zero. 35 features. 135 implementation steps. Complete database schema. Full file structure. AI integration specs. Deployment pipeline. No stubs. No shortcuts. Build it all.*
