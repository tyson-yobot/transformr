# TRANSFORMR Project Instructions
## Automate AI LLC — TRANSFORMR Division Development Standards v1.0

**Last Updated:** April 2026
**Applies To:** All Claude Projects, Claude Code Sessions, and Development Work for TRANSFORMR
**Repository:** github.com/tyson-yobot/transformr
**Branch Strategy:** `dev` (active development, default), `main` (production releases only)

---

## COMPANY STRUCTURE & OWNERSHIP

### Automate AI LLC (Parent Company)
- **Focus:** Mobile-native AI SaaS for consumer transformation, field ops, inspection, compliance
- **Strategy:** 10+ AI apps in 12 months
- **Infrastructure:** AWS hosting, Supabase backend, Zendesk AI support
- **Divisions:**
  - **TRANSFORMR Division:** AI-powered life transformation platform (repo: `transformr`, branch: `dev`)
  - **Construktr Division:** React Native + Expo field ops app (repo: `construktr-mobile`, branch: `chore/ci-update-2025-09-01`)
  - **InspectOne Division:** Mobile inspection suite (repo: `InspectorOne`, branch: `dev`, product name: InspectOne)

### YoBot Inc. (Separate Company)
- **Focus:** Agent operations and automation
- **Primary Asset:** Command-Center (repo: `Command-Center`, branch: `dev`)
- **Stack:** Vite/Next.js web-based control panel
- **Features:** Multi-agent coordination, token control, strategy config, routing, multi-model support

### Development Roots
- **Root Directory:** `C:\dev\transformr`
- **Mobile Project:** `\apps\mobile`
- **Command Execution:** Always start command blocks with `cd` to correct path
- **Alignment:** TRANSFORMR follows the same patterns, conventions, and code style as the Construktr codebase at `C:\dev\construktr\mobile`

---

## PRODUCT OVERVIEW

### What TRANSFORMR Is
The world's first AI-powered total life transformation platform. TRANSFORMR unifies fitness tracking, nutrition management, business revenue monitoring, personal finance, habit building, sleep optimization, mindset development, and relationship accountability into a single interconnected ecosystem — all powered by Anthropic's Claude AI.

### Tagline
"Every rep. Every meal. Every dollar. Every day."

### Primary Users
- **User A:** Male, 140 lbs → 180 lbs goal, building Automate AI / Construktr, revenue goal $1M, timeline 15–18 months
- **User B (Danyell):** Partner with independent fitness, nutrition, and personal goals
- **Future:** Public release — anyone pursuing total life transformation

### Core Countdown
Configurable primary deadline (e.g., "Nils comes home" ~July–October 2027). All progress is measured against this countdown.

### Feature Count: 35 Features (15+ Industry Firsts)
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

## CRITICAL IMPLEMENTATION DIRECTIVES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  MANDATORY REQUIREMENTS — NO EXCEPTIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  • NO minimal implementations, stubs, placeholders, or TODO comments       │
│  • NO hardcoded values — all configuration externalized via .env           │
│  • NO shortcuts — every feature implemented to production-grade quality    │
│  • NO "workarounds" — solve problems correctly the first time             │
│  • NO 'any' types in TypeScript — comprehensive typing required           │
│  • NO @ts-ignore or @ts-expect-error — fix the types properly             │
│  • NO console.log in production — only console.warn and console.error     │
│  • FULL automation using AI wherever possible                              │
│  • COMPLETE error handling with graceful degradation                       │
│  • FULL test coverage for all business logic (80%+ coverage)              │
│  • ACCESSIBILITY compliance on all UI components (44pt touch targets,     │
│    VoiceOver/TalkBack labels, Dynamic Type support)                        │
│  • OFFLINE-FIRST — core features work without internet                    │
│  • DARK MODE FIRST — default theme is dark                                │
│  • Production-ready from first commit                                      │
│  • Apple App Store and Google Play launch-ready quality                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DOCUMENTATION STANDARDS

### File Management Rules
1. **NO duplicate .md files** — consolidate files serving the same purpose
2. **All .md files in repo root** — maintain consistent documentation structure
3. **Update existing docs** vs creating new versions with different names
4. **README.md must include** directive about avoiding duplicate documentation

### Core Documentation Files
| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup, structure, branch strategy |
| `TRANSFORMR-BLUEPRINT.md` | Complete product spec — 35 features, DB schema, screens, seed data, execution plan |
| `CLAUDE-CODE-MASTER-PROMPT.md` | Senior-level build prompt — screen checklist, navigation graph, UX flows, verification |
| `PROJECT-DESCRIPTION.md` | In-depth product description for investors, marketing, onboarding |
| `TRANSFORMR-INSTRUCTIONS.md` | This file — development standards, rules, architecture requirements |
| `.env.example` | All required environment variables with placeholder values |

### Naming Conventions
- Use descriptive, consistent naming: `TRANSFORMR-{Purpose}.md`
- Version increments only for major structural changes
- Never create `TRANSFORMR-BLUEPRINT-v2.md` — update `TRANSFORMR-BLUEPRINT.md` in place

---

## TECHNOLOGY STACK

### Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20.19.4 | Enforced via `.nvmrc` |
| Framework | React Native + Expo | SDK 52+ | Cross-platform iOS/Android |
| Language | TypeScript | 5.x (strict mode) | Full type safety |
| Navigation | Expo Router | v4+ | File-based routing with typed routes |
| State Management | Zustand | 4.5+ | Client-side state |
| Server State | TanStack React Query | 5.x | Data fetching, caching, sync |
| Backend | Supabase | Latest | Managed PostgreSQL + Auth + Realtime + Storage |
| Database | PostgreSQL | 15+ | Via Supabase |
| Edge Functions | Supabase Edge Functions (Deno) | Latest | AI processing, crons, webhooks |
| AI | Anthropic Claude API | claude-sonnet-4-20250514 | All AI features exclusively |
| Charts | Victory Native + react-native-svg | Latest | Data visualization |
| Local Cache | MMKV + AsyncStorage | Latest | Offline-first data |
| Animations | react-native-reanimated 3 | Latest | Micro-interactions, transitions |
| Gestures | react-native-gesture-handler | Latest | Drag-and-drop, swipe actions |

### Device & Platform Integrations

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Camera | expo-camera | Meal photos, barcode scanning, form check |
| Voice Input | expo-av + expo-speech | Voice commands, workout narrator TTS |
| Haptics | expo-haptics | PR celebrations, nudges, timer alerts |
| NFC | react-native-nfc-manager | Trigger automations from physical tags |
| Location | expo-location | Geofence triggers (gym arrival) |
| Widgets | react-native-widget-extension | iOS/Android home screen widgets |
| Watch | react-native-watch-connectivity | Apple Watch companion |
| Biometrics | expo-local-authentication | Face ID / Touch ID / fingerprint |
| Secure Storage | expo-secure-store | API keys, tokens, sensitive data |
| Image Picker | expo-image-picker | Progress photos, vision board |
| Video | expo-av | Form check recording |
| File System | expo-file-system | Data export, offline caching |
| Sharing | expo-sharing | Social content export |
| Notifications | expo-notifications | Push notifications |

### Third-Party Integrations

| Category | Service | Use Case |
|----------|---------|----------|
| Payments | Stripe React Native SDK | Stake goals, revenue auto-tracking |
| Music | react-native-spotify-remote | Workout playlist integration |
| Food Data | OpenFoodFacts API | Barcode nutrition lookup |
| Voice Assistants | Siri Shortcuts / Google Assistant | OS-level voice commands |
| Health | Apple Health / Google Fit | Cross-platform health sync (future) |
| CI/CD | EAS Build + EAS Submit | App Store / Play Store deployment |

### AI Stack — Claude Exclusively

| AI Feature | Implementation | Vision Required |
|------------|---------------|-----------------|
| Meal Camera | Claude Vision API | Yes |
| Form Check | Claude Vision API (video frames) | Yes |
| Menu Scanner | Claude Vision API | Yes |
| Progress Photo Analysis | Claude Vision API | Yes |
| Daily Coaching | Claude Text API | No |
| Adaptive Programming | Claude Text API | No |
| Trajectory Simulation | Claude Text API + local math | No |
| Motivation Engine | Claude Text API | No |
| Journal Prompts | Claude Text API | No |
| Supplement Advisor | Claude Text API | No |
| Grocery List Generator | Claude Text API | No |
| Meal Prep Planner | Claude Text API | No |
| Sleep Optimizer | Claude Text API | No |
| Body-Business Correlation | Claude Text API + local analytics | No |
| Weekly Report Narrative | Claude Text API | No |
| Workout Narrator | Claude Text API → expo-speech TTS | No |

**AI Context Rule:** Every Claude API call MUST include the user's full context in the system prompt: goals, current weight, goal weight, countdown date, last 7 days of workout/nutrition/sleep/mood data, current streaks, business metrics, and preferences. Generic advice is unacceptable — all AI output must be personalized to the individual user's data.

---

## ARCHITECTURE REQUIREMENTS

### Database Schema Standards
- **Minimum Tables:** 45+ tables (TRANSFORMR is a complex multi-domain app)
- **Complete Schemas:** All fields, relationships, constraints, indexes, RLS policies
- **Migrations:** 23 numbered migration files, executed in order
- **Type Generation:** Run `supabase gen types typescript` after every schema change — never manually define types that should come from the database

**Required Table Domains:**
| Domain | Tables |
|--------|--------|
| Users & Partners | profiles, partnerships, countdowns |
| Fitness | exercises, weight_logs, measurements, workout_templates, workout_template_exercises, workout_sessions, workout_sets, personal_records, live_workout_sync, pain_logs, mobility_sessions |
| Nutrition | foods, saved_meals, saved_meal_items, nutrition_logs, water_logs, supplements, supplement_logs, meal_prep_plans, grocery_lists |
| Goals & Habits | goals, goal_milestones, habits, habit_completions |
| Sleep & Mood | sleep_logs, mood_logs, readiness_scores |
| Business | businesses, revenue_logs, expense_logs, customers, business_milestones |
| Finance | finance_accounts, finance_transactions, budgets, net_worth_snapshots |
| Journal & Skills | journal_entries, monthly_letters, skills, books, courses, focus_sessions |
| Social & Community | partner_nudges, partner_challenges, community_challenges, challenge_participants, community_leaderboards |
| System | achievements, user_achievements, dashboard_layouts, nfc_triggers, geofence_triggers, social_content, vision_board_items, stake_goals, stake_evaluations, daily_checkins, weekly_reviews, notification_log |

### Row-Level Security (RLS) — Mandatory
Every table MUST have RLS enabled with policies for:
- **SELECT:** User sees own data + partner data where partnership sharing allows
- **INSERT:** User can only insert their own data
- **UPDATE:** User can only update their own data
- **DELETE:** User can only delete their own data

Helper function for partner access:
```sql
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
```

### Supabase Storage Buckets
| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile photos | Public read, auth write |
| `progress-photos` | Transformation photos | Private (owner + partner) |
| `form-check-videos` | Exercise form recordings | Private (owner only) |
| `meal-photos` | AI meal camera captures | Private (owner only) |
| `vision-board` | Vision board images | Private (owner only) |
| `social-content` | Generated shareable content | Public after share |

### Edge Function Standards
- **Count:** 26 Edge Functions
- **Runtime:** Deno (Supabase default)
- **Language:** TypeScript
- **Auth:** Supabase service role key for database access
- **AI Calls:** Always use `claude-sonnet-4-20250514` model
- **Error Handling:** Try/catch on every operation, structured error responses
- **Logging:** Log all AI calls, durations, and error states

**Required Edge Functions:**

| Category | Functions |
|----------|-----------|
| AI Processing (15) | ai-coach, ai-meal-analysis, ai-form-check, ai-menu-scan, ai-progress-photo, ai-trajectory, ai-weekly-report, ai-motivation, ai-journal-prompt, ai-supplement, ai-grocery-list, ai-meal-prep, ai-sleep-optimizer, ai-adaptive-program, ai-correlation |
| System Crons (6) | daily-reminder, streak-calculator, achievement-evaluator, pr-detection, readiness-score, widget-update |
| Integrations (3) | stripe-webhook, partner-nudge, stake-evaluator |
| Content (2) | social-content-gen, goal-cinema |

### Supabase Realtime
Enable Realtime subscriptions on these tables for couples live sync:
- `workout_sessions`
- `workout_sets`
- `live_workout_sync`
- `partner_nudges`

---

## DESIGN SYSTEM SPECIFICATIONS

### Color Palette — Dark Mode First

```typescript
// Dark theme (DEFAULT)
background: {
  primary: '#0F172A',      // Main background (Slate 900)
  secondary: '#1E293B',    // Cards, surfaces (Slate 800)
  tertiary: '#334155',     // Elevated surfaces (Slate 700)
  input: '#1E293B',        // Form inputs
}
text: {
  primary: '#F8FAFC',      // Primary text (Slate 50)
  secondary: '#94A3B8',    // Secondary text (Slate 400)
  muted: '#64748B',        // Muted text (Slate 500)
  inverse: '#0F172A',      // Text on light surfaces
}
accent: {
  primary: '#6366F1',      // Indigo 500 — main actions, active states
  secondary: '#8B5CF6',    // Violet 500 — partner/couples features
  success: '#22C55E',      // Green 500 — completed, gains, positive
  warning: '#F59E0B',      // Amber 500 — attention, approaching limits
  danger: '#EF4444',       // Red 500 — missed, broken, overdue
  info: '#3B82F6',         // Blue 500 — informational
  fire: '#F97316',         // Orange 500 — streaks
  gold: '#EAB308',         // Yellow 500 — achievements
  pink: '#EC4899',         // Pink 500 — partner/love
}
```

### Typography System

```typescript
typography: {
  hero:        { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  h1:          { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h2:          { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  h3:          { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body:        { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold:    { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  caption:     { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  stat:        { fontSize: 28, fontWeight: '700', fontFamily: 'SF Mono / JetBrains Mono' },
  statSmall:   { fontSize: 20, fontWeight: '600', fontFamily: 'SF Mono / JetBrains Mono' },
  tiny:        { fontSize: 11, fontWeight: '500', lineHeight: 14 },
}
```

### Design Tokens

```typescript
spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }

borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 }

// Touch targets: MINIMUM 44pt on all interactive elements (Apple HIG)
// Haptic feedback on: button presses, PR achievements, streak milestones,
//                     toggle switches, timer completions, errors
```

### Component Style
- Rounded corners (12–16px border radius) on cards
- Subtle glass-morphism on elevated surfaces (semi-transparent with blur)
- Spring physics animations on interactive elements (react-native-reanimated)
- Haptic feedback on key actions
- Skeleton loading states on every screen (never blank screens)
- Monospace font (SF Mono / JetBrains Mono) for all numeric data displays

---

## NAVIGATION ARCHITECTURE

### Tab Navigator (5 Tabs)

```
[Dashboard]  [Fitness]  [Nutrition]  [Goals]  [Profile]
     🏠          💪          🍽️         🎯        👤
```

### Navigation Rules — MANDATORY

1. **Every pushed screen MUST have a back button** (left arrow or "< Back") in the header — no exceptions
2. **No dead ends** — every screen the user can navigate to must have a way to navigate away
3. **Workout player hides tab bar** — full-screen immersive experience with prominent "End Workout" button always visible
4. **Modals use `presentation: 'modal'`** — with "X" close button or swipe-to-dismiss
5. **Swipe-back gesture works on every stack screen** (iOS)
6. **Deep links resolve correctly:** `transformr://workout/start`, `transformr://nutrition/add`, etc.
7. **Keyboard dismisses properly** on all input screens
8. **Keyboard avoidance works** — inputs never hide behind the keyboard

### Screen Map (Every Route)

**Auth Stack:**
- `(auth)/login.tsx` → `(auth)/register.tsx` → `(auth)/forgot-password.tsx`
- `(auth)/onboarding/` → 9 sequential screens with progress indicator

**Dashboard Tab:**
- `(tabs)/dashboard.tsx` → pushes to `trajectory.tsx`, `weekly-review.tsx`, `goal-cinema.tsx`

**Fitness Tab:**
- `(tabs)/fitness/index.tsx` → `workout-player.tsx` (full screen) → `workout-summary.tsx`
- → `exercises.tsx` → `exercise-detail.tsx`
- → `progress.tsx`, `programs.tsx`, `form-check.tsx`, `pain-tracker.tsx`, `mobility.tsx`

**Nutrition Tab:**
- `(tabs)/nutrition/index.tsx` → `add-food.tsx`, `meal-camera.tsx`, `barcode-scanner.tsx`, `menu-scanner.tsx`
- → `saved-meals.tsx`, `meal-plans.tsx`, `meal-prep.tsx`, `grocery-list.tsx`, `supplements.tsx`, `analytics.tsx`

**Goals Tab:**
- `(tabs)/goals/index.tsx` → `habits.tsx`, `sleep.tsx`, `mood.tsx`, `journal.tsx`, `focus-mode.tsx`
- → `vision-board.tsx`, `skills.tsx`, `challenges.tsx`, `stake-goals.tsx`
- → `business/index.tsx` → `revenue.tsx`, `customers.tsx`, `milestones.tsx`
- → `finance/index.tsx` → `transactions.tsx`, `budgets.tsx`, `net-worth.tsx`

**Profile Tab:**
- `(tabs)/profile/index.tsx` → `partner.tsx`, `achievements.tsx`, `dashboard-builder.tsx`
- → `notifications-settings.tsx`, `nfc-setup.tsx`, `integrations.tsx`, `data-export.tsx`, `about.tsx`

**Partner Screens (Modal Stack):**
- `partner/dashboard.tsx`, `partner/live-workout.tsx`, `partner/challenges.tsx`, `partner/nudge.tsx`

---

## OFFLINE-FIRST ARCHITECTURE

### Principle
Core logging features MUST work without internet. The user should never wait for a network request to log a workout set, a meal, water intake, or a habit completion.

### Implementation

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Fast Cache | MMKV | Key-value store for active session data, preferences, offline queue |
| Persistent Cache | AsyncStorage | Larger datasets, auth tokens via Supabase adapter |
| Offline Queue | MMKV | Stores writes that failed due to no connectivity |
| Sync Engine | Custom hook (`useOfflineSync`) | Flushes queue on reconnection, handles conflicts (last-write-wins) |
| Sync Indicator | UI component | Shows offline badge + pending sync count |

### What Must Work Offline
- Workout logging (full session: start, log sets, finish)
- Meal logging (manual entry and saved meals)
- Water tracking
- Habit completion
- Supplement check-off
- Weight logging
- Sleep logging
- Mood logging

### What Requires Connectivity
- AI features (meal camera, form check, coaching, etc.)
- Partner live sync
- Push notifications
- Barcode/OpenFoodFacts lookup
- Stripe transactions
- Spotify playback
- Community leaderboards

---

## PERFORMANCE REQUIREMENTS

| Metric | Target |
|--------|--------|
| App launch to interactive dashboard | < 2 seconds (iPhone 12+) |
| Screen transitions | < 300ms with fluid animations |
| Logging a workout set | < 3 taps, < 2 seconds |
| Logging a food item (from search) | < 4 taps, < 3 seconds |
| AI meal camera analysis | < 5 seconds (photo to result) |
| Pull-to-refresh data update | < 1 second |
| Offline logging operations | Zero latency (local write) |
| List scrolling | 60fps, no frame drops |
| Memory usage | Stable, no leaks on repeated navigation |

### Performance Implementation
- `FlatList` with `getItemLayout` for fixed-height items
- `windowSize` optimization on long lists
- `React.memo` on pure components
- `useMemo` / `useCallback` where re-renders are expensive
- Lazy loading for non-critical screens
- Image caching and progressive loading
- Virtualized lists for exercise library, food search, transaction history

---

## SEED DATA REQUIREMENTS

The database MUST be pre-populated with production-quality seed data on first deployment:

| Data Type | Minimum Count | Details |
|-----------|--------------|---------|
| Exercises | 100+ | Full metadata: name, category, muscle_groups[], equipment, difficulty, instructions, tips, common_mistakes, is_compound |
| Foods | 100+ | Full nutrition: name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium |
| Saved Meal Templates | 10+ | Morning Bulk Shake, Post-Workout Bowl, Easy Gainer Snack, etc. with linked food items |
| Workout Programs | 4 | Push/Pull/Legs (6-day), Upper/Lower (4-day), Full Body (3-day), Couples (1-day) with full exercise assignments |
| Achievements | 75+ | All categories (fitness, nutrition, body, business, finance, consistency, partner, community, mindset, learning) with tier assignments |
| Business Milestones | 11 | Pre-seeded for Construktr: First Customer through $1M Cumulative Revenue |
| Default Habits | 9 | Sleep 6+h, 2800+ cal, 155g+ protein, 100oz water, gym, 4h Construktr, creatine, check-in, no 24h sessions |

---

## GAMIFICATION SYSTEM

### Streaks
- Tracked per habit, per user, and per partnership (joint streaks)
- Streak shields: earn 1 shield per 30-day streak (allows 1 miss without breaking)
- Streak milestones: 7, 14, 30, 60, 90, 180, 365 days
- Visual: fire emoji chain, GitHub-style calendar heatmap, "Don't break the chain" display

### Achievements (75+ Badges)
- **Tiers:** Bronze → Silver → Gold → Diamond
- **Categories:** Fitness, Nutrition, Body, Business, Finance, Consistency, Partner, Community, Mindset, Learning
- **Secret achievements:** Hidden until earned for surprise delight
- **Celebration:** Lottie animation + haptic feedback on unlock

### Readiness Score
- Daily 1–100 score aggregated from sleep, soreness, stress, energy, training load
- Color-coded: Green (go hard), Yellow (moderate), Red (recover)
- Auto-adjusts today's recommended workout intensity

### Day Score
- Auto-calculated from: habits completed, nutrition targets hit, workout logged, sleep quality, focus hours
- Displayed on daily check-in and weekly review

---

## NOTIFICATION SYSTEM

### Scheduled Notifications
| Time | Notification | Type |
|------|-------------|------|
| Wake time | "Good morning! Here's your plan for today." | Daily briefing |
| Wake + 30min | "Time for breakfast. You need X cal today." | Meal reminder |
| 3hr after last meal | "Time to eat again. You're at X/Y cal." | Meal reminder |
| Gym time | "Today is Push Day. Let's get it." | Workout reminder |
| Post-workout | "Log your workout while it's fresh!" | Logging reminder |
| Hourly | "Have you had water recently?" | Water reminder |
| 10 PM | "Time for your nightly check-in." | Check-in prompt |
| 11 PM | "Wind down. Sleep is when you grow." | Sleep reminder |
| Sunday 10 AM | "Weekly review time. Let's see your progress." | Weekly review |

### Smart Notifications (Contextual, Data-Driven)
- If no food logged by noon: "You haven't eaten today."
- If weight trending wrong direction: "Your weight dropped. Increase calories by 200."
- If workout missed: "You missed Push Day. Reschedule for tomorrow?"
- If partner hasn't logged: "Danyell hasn't checked in. Send a nudge?"
- If approaching PR: "You're 5 lbs from a bench press PR!"
- Streak protection: "Your 14-day streak is at risk! Log something today."

---

## SECURITY & PRIVACY

### Data Protection
- All API keys stored in `expo-secure-store` (encrypted native keychain)
- Row-level security on every database table
- TLS for all data in transit
- Biometric authentication option (Face ID, Touch ID, fingerprint)
- Automatic session timeout after configurable period

### Sensitive Data Handling
- Progress photos stored in private Supabase storage buckets
- Form check videos accessible only to the recording user
- Journal entries private by default (configurable partner sharing)
- Financial data never shared with partner unless explicitly enabled
- AI API calls do not store user data beyond the request context

### Health Data Compliance
- Users own their data — full export capability (CSV, JSON, PDF)
- Delete account removes all data permanently
- No third-party data selling or sharing
- Privacy policy and terms of service accessible from profile/about screen
- Health data (weight, nutrition, sleep) handled with appropriate sensitivity

---

## TESTING REQUIREMENTS

### Coverage Thresholds
| Metric | Threshold |
|--------|-----------|
| Statements | 80%+ |
| Branches | 75%+ |
| Functions | 80%+ |
| Lines | 80%+ |

### Required Test Categories

**Unit Tests — Calculation Functions:**
- BMR / TDEE calculator
- Macro target calculator
- Streak logic (increment, reset, shields)
- PR detection (all record types)
- Readiness score algorithm
- Day score algorithm
- Revenue projections
- Weight projections
- Calorie/macro totals

**Integration Tests:**
- Auth flow: register → onboarding → dashboard
- Workout flow: start → log sets → PR detection → finish → summary
- Nutrition flow: add food → log meal → macro update
- Partner flow: invite → accept → nudge → live sync

**E2E Tests (Critical Journeys):**
- First-time user: open → register → onboard → dashboard
- Morning routine: dashboard → start workout → log → finish
- Meal logging: nutrition → camera/search → log → macros update
- Evening check-in: notification → journal → habits → sleep log
- Weekly review: notification → review → grades → next week goals

### Test Tools
- **Unit:** Jest + @testing-library/react-native
- **E2E:** Detox or Maestro
- **Type Check:** `tsc --noEmit` (zero errors required)
- **Lint:** ESLint with @typescript-eslint (zero errors required)

---

## UI/UX STANDARDS

### Every Screen Must Have
1. **Proper navigation** — back button on pushed screens, close button on modals
2. **Loading state** — skeleton components while data loads, never blank screens
3. **Empty state** — friendly message + icon + CTA button when lists have no data
4. **Error state** — toast notification on API errors, never crash, never blank screen
5. **Pull-to-refresh** — on all scrollable/list screens
6. **Keyboard handling** — dismiss on tap outside, avoidance so inputs don't hide
7. **Haptic feedback** — on interactive elements per the haptic specification
8. **Accessibility labels** — on all interactive elements for VoiceOver/TalkBack
9. **Dark mode rendering** — verified working on every screen
10. **Light mode rendering** — verified working on every screen

### Speed Standard
- Logging actions (workout set, food item, water, habit) must complete in **< 3 taps and < 3 seconds**
- If logging is slow or requires many taps, users will stop logging — this is a product-killing UX failure

---

## COMMIT & BRANCH STRATEGY

### Branch Rules
- `dev` — active development, default branch, all feature work merges here
- `main` — production releases only, created via PR from `dev`
- Feature branches from `dev`: `feature/workout-player`, `feature/meal-camera`, etc.

### Commit Messages (Conventional Commits)
```
feat: implement auth flow with Apple/Google sign-in
feat: build complete workout player with ghost mode and PR detection
feat: implement AI meal camera with Claude Vision
fix: resolve keyboard avoidance on nutrition add-food screen
perf: optimize exercise library list with virtualization
test: add unit tests for BMR and macro calculations
chore: configure EAS production build profiles
refactor: extract shared chart components
docs: update blueprint with new Edge Function specs
```

### PR Requirements
- TypeScript compiles with zero errors
- ESLint passes with zero errors
- All tests pass
- At least 1 review approval (when team > 1)

---

## IMPLEMENTATION PHASES

### Phase 1: Infrastructure (Day 1)
Steps 1–14: Repo setup, Supabase project, dependencies, migrations, seed data, EAS config

### Phase 2: Design System + Auth (Days 2–3)
Steps 15–22: Theme, UI primitives, chart components, auth, onboarding, navigation

### Phase 3: Core Fitness (Days 4–6)
Steps 23–34: Dashboard, weight logging, exercises, workout player, ghost mode, PRs, progress, pain tracker, mobility

### Phase 4: Core Nutrition (Days 7–9)
Steps 35–45: Daily view, food search, saved meals, water, supplements, meal camera, barcode, menu scanner, meal prep, grocery list, analytics

### Phase 5: Goals, Habits, Routine (Days 10–12)
Steps 46–57: Goals, habits, streaks, sleep, mood, readiness, focus mode, journal, check-ins, weekly review, skills, vision board

### Phase 6: Business + Finance (Days 13–14)
Steps 58–65: Business dashboard, revenue, customers, milestones, personal finance, budgets, net worth, Stripe webhook

### Phase 7: AI Intelligence Layer (Days 15–18)
Steps 66–78: All 15 AI services, trajectory simulator, correlation engine, weekly report, Goal Cinema

### Phase 8: Partner / Couples (Days 19–21)
Steps 79–86: Partner linking, partner dashboard, nudges, live sync workout, challenges, joint streaks, activity feed, reactions

### Phase 9: Community + Social (Days 22–23)
Steps 87–91: Community challenges, leaderboards, social content generator, transformation time-lapse, stake goals

### Phase 10: Voice, NFC, Widgets, Watch (Days 24–26)
Steps 92–100: Voice commands, NFC triggers, geofences, home screen widgets, Siri Shortcuts, Apple Watch, Spotify

### Phase 11: Dashboard Builder + Polish (Days 27–28)
Steps 101–110: Drag-and-drop dashboard, dark/light mode, animations, haptics, skeletons, offline sync, error boundaries, data export

### Phase 12: Notifications + Automation (Days 29–30)
Steps 111–120: Push notifications, scheduled/smart notifications, streak calculator cron, achievement evaluator cron, Edge Function deployment

### Phase 13: Testing + Launch (Days 31–35)
Steps 121–135: Unit tests, integration tests, E2E tests, accessibility audit, performance optimization, App Store assets, privacy policy, EAS builds, TestFlight, Play Store internal, submission

---

## QUALITY BENCHMARKS

| Metric | TRANSFORMR Target |
|--------|-------------------|
| Features | 35 (15+ industry firsts) |
| Database Tables | 45+ |
| Edge Functions | 26 |
| AI Service Modules | 15 |
| Supabase Storage Buckets | 6 |
| Seeded Exercises | 100+ |
| Seeded Foods | 100+ |
| Seeded Achievements | 75+ |
| Workout Programs | 4 |
| Saved Meal Templates | 10+ |
| Screen Routes | 50+ |
| Implementation Steps | 135 |
| Test Coverage | 80%+ |

---

## APP STORE READINESS CHECKLIST

- [ ] App icon generated (1024×1024 source) for iOS and Android
- [ ] Splash screen renders correctly (centered logo on #0F172A background)
- [ ] All iOS permission strings are descriptive and App Store Review compliant
- [ ] All Android permissions declared in app.json
- [ ] `expo.ios.config.usesNonExemptEncryption: false` set
- [ ] Privacy policy hosted and linked from profile/about screen
- [ ] Terms of service hosted and linked from profile/about screen
- [ ] App Store screenshots generated (6.7", 6.5", 5.5" for iOS; phone + tablet for Android)
- [ ] App Store preview video created (optional but recommended)
- [ ] App Store listing copy finalized (name, subtitle, description, keywords)
- [ ] Age rating set: 4+
- [ ] Category set: Health & Fitness
- [ ] EAS production build succeeds for both iOS and Android
- [ ] TestFlight build uploaded and tested
- [ ] Google Play internal testing build uploaded and tested
- [ ] No console.log statements in production code
- [ ] No hardcoded API keys or secrets in source
- [ ] All Supabase RLS policies active
- [ ] All Edge Functions deployed and responding
- [ ] App runs correctly on iOS simulator AND Android emulator

---

## COMMAND EXECUTION STANDARDS

```bash
# Always start command blocks with cd to correct path
cd C:\dev\transformr && npm install

# Mobile-specific commands
cd C:\dev\transformr\apps\mobile && npx expo start

# Supabase commands
cd C:\dev\transformr && supabase db push
cd C:\dev\transformr && supabase functions deploy

# Build commands
cd C:\dev\transformr\apps\mobile && eas build --platform all --profile production

# Type checking
cd C:\dev\transformr\apps\mobile && npx tsc --noEmit

# Linting
cd C:\dev\transformr\apps\mobile && npx eslint .

# Testing
cd C:\dev\transformr\apps\mobile && npx jest --coverage

# Never assume current directory
# Never run commands without cd prefix
```

---

## FINAL DIRECTIVE

Build TRANSFORMR as if 100,000 users will download it on launch day. Every screen must be fully functional. Every button must do something. Every route must resolve. Every empty state must guide the user. Every error must be caught gracefully. Every AI response must be personalized. Every animation must be smooth. Every offline action must sync when connectivity returns. Every partner feature must work in real time. Every achievement must celebrate the user's progress.

This is not a prototype. This is not an MVP. This is the most complete life transformation platform ever built — and it must work flawlessly from the moment a user opens it for the first time.

**NO SHORTCUTS. NO STUBS. NO WORKAROUNDS. NO 'ANY' TYPES. NO PLACEHOLDERS. NO COMING SOON. PRODUCTION-GRADE FROM DAY ONE.**

---

*Automate AI LLC — Building the future of AI-powered personal and professional transformation.*
