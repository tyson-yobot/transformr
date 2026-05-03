# NOTIFICATIONS SYSTEM AUDIT

**Date:** 2026-04-30
**Branch:** dev
**Auditor:** Claude Code (read-only)
**Status:** Partially implemented, critical gaps identified

---

## EXECUTIVE SUMMARY

The notifications system has **strong server-side infrastructure** (3 Edge Functions, 2 DB tables, AI-driven accountability engine) but **critical client-side wiring gaps**. The push token registration function exists but is never called. No notification tap handler exists. The "3-level frequency system" does not exist as such — it is instead a **4-value coaching tone** (`drill_sergeant`, `motivational`, `balanced`, `calm`) used by the daily-accountability Edge Function.

### Severity Matrix

| Area | Status | Severity |
|------|--------|----------|
| Package installed & configured | COMPLETE | -- |
| Client notification service | COMPLETE | -- |
| Push token registration | EXISTS but NEVER CALLED | CRITICAL |
| Notification tap handling | NOT IMPLEMENTED | CRITICAL |
| Server-side daily reminders | COMPLETE | -- |
| Smart notification engine | COMPLETE | -- |
| Daily accountability AI | COMPLETE | -- |
| `notifications` vs `notification_log` table mismatch | BUG | CRITICAL |
| Settings UI | COMPLETE | -- |
| Onboarding prefs | COMPLETE | -- |
| Local notification scheduling | EXPORTED but NEVER CALLED | HIGH |
| Quiet hours | UI ONLY (no enforcement logic) | MEDIUM |
| 3-level frequency/tier system | DOES NOT EXIST | N/A (never built) |
| In-app notification tray/inbox | NOT IMPLEMENTED | MEDIUM |

---

## 1. CONFIGURATION

### 1.1 Package Installation

**Status:** INSTALLED

- `apps/mobile/package.json:54` — `"expo-notifications": "~0.31.0"`
- `package-lock.json:10602` — Resolved to `expo-notifications-0.31.5`

### 1.2 app.json Plugin

**Status:** CONFIGURED

- `apps/mobile/app.json:85` — `"expo-notifications"` listed in `plugins` array
- No additional plugin configuration object (uses defaults)

### 1.3 FCM / Firebase

**Status:** NOT CONFIGURED

- No `google-services.json` found in project
- No `@react-native-firebase/messaging` in package.json
- Expo Notifications uses Expo Push Service as intermediary (FCM/APNS handled by Expo servers when using `ExponentPushToken`)

### 1.4 APNS

**Status:** IMPLICITLY CONFIGURED via Expo

- No explicit APNS entitlement in `app.json` iOS config
- The `expo-notifications` plugin handles APNS configuration at build time via EAS
- Note: `app.json:42-47` has entitlements for NFC and Siri but NOT explicit push notification entitlement (Expo plugin handles this)

### 1.5 Android Permissions

**Status:** PARTIAL

- `app.json:71` — `android.permission.VIBRATE` present
- `app.json:72` — `android.permission.RECEIVE_BOOT_COMPLETED` present (needed for scheduled notifications)
- `POST_NOTIFICATIONS` (Android 13+) is NOT listed — `expo-notifications` plugin adds it automatically at build time

### 1.6 Runtime Permission Request

**Status:** IMPLEMENTED in two places

- `services/notifications.ts:23-28` — `registerForPushNotifications()` calls `getPermissionsAsync()` then `requestPermissionsAsync()`
- `app/(auth)/onboarding/notifications.tsx:190-200` — `requestPermission()` calls `requestPermissionsAsync()` during onboarding

---

## 2. CLIENT-SIDE INFRASTRUCTURE

### 2.1 All expo-notifications Imports

| File | Purpose |
|------|---------|
| `services/notifications.ts:1` | Central service: permission request, token registration, schedule/cancel, listeners |
| `app/(auth)/onboarding/notifications.tsx:9` | Onboarding: permission request |
| `app/(tabs)/profile/notifications-settings.tsx:24` | Settings: permission check, test notification |

### 2.2 Central Notification Service

**File:** `apps/mobile/services/notifications.ts` (119 lines)

**Exported functions:**

| Function | Line | Purpose |
|----------|------|---------|
| `registerForPushNotifications()` | 18 | Request permission, get Expo push token, create Android channels |
| `savePushToken(userId, token)` | 66 | Upsert `expo_push_token` on `profiles` table via Supabase |
| `scheduleLocalNotification(title, body, trigger, data)` | 73 | Generic local notification scheduler |
| `scheduleDailyNotification(title, body, hour, minute, id)` | 85 | Daily repeating local notification (cancels previous by ID first) |
| `cancelNotification(identifier)` | 100 | Cancel single scheduled notification |
| `cancelAllNotifications()` | 104 | Cancel all scheduled notifications |
| `addNotificationListener(handler)` | 108 | Listen for received notifications (foreground) |
| `addNotificationResponseListener(handler)` | 114 | Listen for notification taps |

**Android Channels Created (line 39-61):**
- `default` — MAX importance, vibration, purple light (#A855F7)
- `workout` — HIGH importance, vibration
- `nutrition` — DEFAULT importance
- `partner` — HIGH importance

### 2.3 Notification Handler Configuration

**File:** `services/notifications.ts:8-16`

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

This means foreground notifications WILL show as alerts/banners. However, this only executes if this module is imported — and no evidence exists that it's imported at app root level.

### 2.4 Hook for Notifications

**Status:** DOES NOT EXIST

- No `useNotifications` hook found in `hooks/` directory
- No `useSmartNotifications` hook (spec'd in phase-07 spec but never built)
- Grep for `useNotification` across all `.ts`/`.tsx` files: zero results

### 2.5 Notifications Store

**Status:** DOES NOT EXIST

- No `notificationStore.ts` or `smartNotificationStore.ts` in `stores/`
- No Zustand store manages notification state
- Notification preferences live on the `profiles` table as JSONB (`notification_preferences` column)

### 2.6 Push Token Registration

**Status:** FUNCTION EXISTS, NEVER CALLED

- `registerForPushNotifications()` is defined at `services/notifications.ts:18`
- `savePushToken()` is defined at `services/notifications.ts:66`
- **Neither function is imported or called anywhere in the app** (only in their definition file)
- The `profiles` table has `expo_push_token TEXT` column (`migrations/00001:40`)
- **BUG:** Users' push tokens are never saved to the database, so server-side push delivery will silently fail for all users

### 2.7 Scheduling Model

**Status:** LOCAL scheduling functions exist but are NEVER CALLED

- `scheduleLocalNotification` and `scheduleDailyNotification` are exported but grep shows zero call sites outside of definitions
- The app does NOT schedule local notifications after onboarding
- All notifications rely on server-side delivery (Edge Functions insert into a `notifications` table)

---

## 3. SCHEDULING SYSTEM

### 3.1 Server-Side Scheduled Notifications

The `daily-reminder` Edge Function (`supabase/functions/daily-reminder/index.ts`) implements:

| Notification | Implemented | Trigger Logic | Time Determination |
|-------------|-------------|---------------|-------------------|
| Wake-up briefing | YES (line 44-54) | `userHour === wakeHour` | User pref `wake_reminder_hour`, default 6 |
| Meal reminders | YES (line 56-68) | `mealHours.includes(userHour)` | User pref `meal_reminder_hours`, default [8,12,18] |
| Workout time | YES (line 70-85) | `userHour === gymHour && workoutDay` | User pref `gym_reminder_hour` default 17, `workout_days` default Mon-Fri |
| Sleep wind-down | YES (line 87-97) | `userHour === sleepHour` | User pref `sleep_reminder_hour`, default 22 |
| Hourly water | NO | -- | -- |
| Post-workout logging | NO | -- | -- |
| 10pm check-in | NO (daily_accountability covers 8pm) | -- | -- |
| Sunday weekly review | NO (in settings UI but not in daily-reminder) | -- | -- |

**Note:** The `daily-reminder` function reads `notification_preferences` from profiles but uses DIFFERENT field names (`wake_reminder_hour` vs `wake_up.time`) than what the onboarding screen saves. This is a data contract mismatch.

### 3.2 Daily Accountability AI (3x/day)

**File:** `supabase/functions/daily-accountability/index.ts`

Runs at user-local hours 9, 14, and 20. Generates AI-powered accountability messages using Claude Sonnet. Adapts to `gamification_style` (coaching tone). Inserts into `proactive_messages` and `notifications` tables.

**Cancelation:** Midday check skipped if user is 80%+ complete (line 236-258). Evening check skipped if a `nightly_check_in` already exists (line 261-271).

### 3.3 Local Cancelation on Condition Change

**Status:** NOT IMPLEMENTED

- No code cancels a scheduled notification when a meal is logged, workout is completed, etc.
- The server-side approach evaluates conditions at send time rather than pre-scheduling and canceling

---

## 4. SMART / CONTEXTUAL NOTIFICATIONS

### 4.1 Smart Notification Engine

**File:** `supabase/functions/smart-notification-engine/index.ts` (572 lines)

**Status:** FULLY IMPLEMENTED (all 12 trigger types have evaluators)

| Trigger | Evaluator Function | Fire Condition |
|---------|-------------------|----------------|
| `missed_workout` | `evaluateMissedWorkout` (line 78) | No workout in 2+ days |
| `missed_meal_log` | `evaluateMissedMealLog` (line 98) | After 2pm, no meals today |
| `water_reminder` | `evaluateWaterReminder` (line 128) | After noon, < 40% water target |
| `supplement_reminder` | `evaluateSupplementReminder` (line 169) | Active supplements not logged today |
| `sleep_window` | `evaluateSleepWindow` (line 218) | 9-11pm, avg sleep < 7 hours |
| `streak_at_risk` | `evaluateStreakAtRisk` (line 250) | After 6pm, no habits completed today |
| `weight_logged_weekly` | `evaluateWeightLoggedWeekly` (line 275) | No weight logged in 7 days |
| `journal_prompt` | `evaluateJournalPrompt` (line 295) | No journal entry in 3 days (uses AI to generate prompt) |
| `goal_deadline_approaching` | `evaluateGoalDeadline` (line 357) | Active goal due within 7 days |
| `mood_check_in` | `evaluateMoodCheckIn` (line 394) | After 10am, no mood logged today |
| `recovery_day` | `evaluateRecoveryDay` (line 417) | 5+ workouts in last 5 days |
| `focus_session_reminder` | Stub (line 457) | Always returns `should_fire: false` |

### 4.2 Delivery Mechanism

The smart-notification-engine:
1. Reads all enabled `smart_notification_rules` (line 477-483)
2. Enforces per-rule cooldown via `cooldown_hours` + `last_triggered_at` (line 506-510)
3. Inserts into `proactive_messages` table for in-app display (line 523)
4. Sends Expo Push via `sendExpoPushNotification()` (line 28-58) using the Expo Push HTTP API
5. Updates `last_triggered_at` (line 542-545)

### 4.3 Partner Nudge

**File:** `supabase/functions/partner-nudge/index.ts`

- User-initiated (not cron). Requires authenticated request with `partner_id` + `nudge_type`
- Rate-limited: max 3 nudges/day per sender→recipient pair (line 76-92)
- Types: `workout`, `meal`, `checkin`, `motivation`, `custom` (line 104-125)
- Inserts into `partner_nudges` log and `notifications` table

---

## 5. FREQUENCY / TIER SYSTEM

### 5.1 The "3-Level" System

**Status:** DOES NOT EXIST

No code anywhere in the codebase references "Gentle", "Standard", or "Active" notification frequency levels. No `notification_frequency`, `notification_tier`, or `notification_level` column exists.

### 5.2 What DOES Exist: Coaching Tone (4 values)

**Migrations:**
- `00036_expand_coaching_tone.sql` — Added `gamification_style` column
- `00038_fix_missing_columns.sql:7-27` — Added canonical `coaching_tone` column, back-filled from `gamification_style`

**Values:** `drill_sergeant`, `motivational`, `balanced`, `calm`

**Where it's READ:**
- `daily-accountability/index.ts:117-118` — `const coachingTone = profile.gamification_style ?? "balanced"` (note: reads `gamification_style`, not `coaching_tone` — possible bug)

**Where it's SET:**
- Not found in the notifications settings UI
- Likely set elsewhere in profile/settings (not in notification-specific code)

**Effect on notifications:** The coaching tone is passed to the AI system prompt in `daily-accountability` to adapt message style. It does NOT affect notification frequency, volume, or timing.

### 5.3 Cooldown Mechanism (Per-Rule)

The `smart_notification_rules` table has `cooldown_hours INTEGER DEFAULT 24` per trigger type. This acts as a per-trigger frequency control but is not user-configurable via any UI.

---

## 6. NOTIFICATION SETTINGS UI

### 6.1 Screen Location

**File:** `apps/mobile/app/(tabs)/profile/notifications-settings.tsx` (502 lines)

### 6.2 Controls Exposed

| Control | Type | Key |
|---------|------|-----|
| Global on/off | Toggle | `globalEnabled` (local state only) |
| Wake-Up Reminder | Toggle + time edit | `wake_up` |
| Meal Reminders | Toggle + time edit | `meals` |
| Gym Reminder | Toggle + time edit | `gym` |
| Sleep Reminder | Toggle + time edit | `sleep` |
| Water Reminders | Toggle | `water` |
| Daily Check-In | Toggle + time edit | `daily_checkin` |
| Weekly Review | Toggle | `weekly_review` |
| Focus Reminder | Toggle + time edit | `focus_reminder` |
| Supplement Reminders | Toggle | `supplement` |
| Partner Activity | Toggle | `partner_activity` |
| Priority Slots (4) | Toggle per slot | Subset of above |
| Quiet Hours | DISPLAY ONLY (informational card) | No user control |
| Test Notification | Button | Fires immediate test push |

### 6.3 State Persistence

- Saved to `profiles.notification_preferences` JSONB column via `useProfileStore.updateProfile()` (line 198)
- Individual toggles call `updateProfile({ notification_preferences: newPrefs })` immediately

### 6.4 Global Toggle Gap

**BUG:** The "global enabled" toggle at line 243-249 sets local state only:
```ts
// When disabled, we keep saved prefs but stop sending
// In production this would update the push notification subscription
```
This is an acknowledged stub — the global disable does NOT actually prevent notifications from being sent.

### 6.5 No Frequency/Tier Controls

The settings screen has NO:
- Frequency tier selector (Gentle/Standard/Active)
- Daily cap control
- Quiet hours time picker
- Per-type cooldown configuration

---

## 7. EDGE FUNCTIONS / SERVER-SIDE

### 7.1 Notification-Related Edge Functions

| Function | Purpose | Inserts Into | Cron? |
|----------|---------|-------------|-------|
| `daily-reminder` | Fixed-schedule reminders (wake, meal, gym, sleep) | `notifications` | Expected (hourly) |
| `smart-notification-engine` | Data-driven contextual notifications (12 triggers) | `proactive_messages` + Expo Push | Expected (every 30min) |
| `daily-accountability` | AI tone-adaptive accountability (3x/day) | `proactive_messages` + `notifications` | Expected (hourly) |
| `partner-nudge` | User-to-user nudge | `partner_nudges` + `notifications` | No (on-demand) |
| `streak-calculator` | Streak milestone alerts | `notifications` | Expected |
| `achievement-evaluator` | Achievement unlock notifications | `notifications` | Expected |
| `stake-evaluator` | Stake goal deadline alerts | `notifications` | Expected |
| `challenge-evaluator` | Challenge progress/completion | `notification_log` | Expected |

### 7.2 CRITICAL BUG: `notifications` Table Does Not Exist

**Evidence:**
- The migration `00020_create_notifications.sql` creates `notification_log` (with columns: id, user_id, type, title, body, data, is_sent, sent_at, is_read, read_at, created_at)
- 7 Edge Functions insert into `from("notifications")` — a table that DOES NOT EXIST in any migration
- Only `challenge-evaluator` correctly uses `from("notification_log")`

**Affected Functions:**
1. `daily-reminder/index.ts:103`
2. `daily-accountability/index.ts:341`
3. `partner-nudge/index.ts:144`
4. `streak-calculator/index.ts:121`
5. `achievement-evaluator/index.ts:447`
6. `stake-evaluator/index.ts:230`
7. `stripe-webhook/index.ts:415`

**Impact:** All server-side notifications (except challenge-evaluator) will throw a Supabase error at runtime because the target table doesn't exist. The smart-notification-engine bypasses this by using `proactive_messages` + direct Expo Push.

### 7.3 `notification_log` Table

**Migration:** `00020_create_notifications.sql`

```sql
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
```

RLS: `00023_create_rls_policies.sql:60` — enabled. Policy at line 275: `"Own notifications" ON notification_log FOR ALL USING (auth.uid() = user_id)`

### 7.4 `smart_notification_rules` Table

**Migration:** `00034_smart_notification_rules.sql`

- 12 trigger types (see Section 4.1)
- Per-user, per-trigger: `is_enabled`, `cooldown_hours`, `custom_message`, `last_triggered_at`
- Auto-seeded for new users via trigger on `profiles` insert (line 46-70)
- RLS enabled with "Users manage their own notification rules" policy

### 7.5 `proactive_messages` Table

**Migration:** `00038_fix_missing_columns.sql` (partial — uses `IF NOT EXISTS`)

- Columns: id, user_id, category, title, body, severity, action_label, action_route, is_read, is_dismissed, priority, expires_at, created_at
- Categories: `reorder`, `nutrition`, `workout`, `sleep`, `mood`, `habit`, `goal`, `business`, `weather`, `general`
- Note: The `daily-accountability` function writes categories like `accountability_morning`, `accountability_midday`, `accountability_evening` which are NOT in the CHECK constraint — this will cause insert failures

### 7.6 Cron Scheduling

**Status:** NOT VERIFIED (cannot check Supabase dashboard)

The functions reference cron scheduling in comments and specs (`docs/superpowers/specs/phase-07-smart-notifications.md:11` — "pg_cron every 30 min") but no `pg_cron` SQL is present in any migration file. Cron jobs are likely configured via the Supabase Dashboard or have been scheduled externally.

---

## 8. NOTIFICATION HANDLERS (Client-Side)

### 8.1 Notification Tap Handling

**Status:** NOT IMPLEMENTED

- `addNotificationResponseListener` is exported from `services/notifications.ts:114-117`
- It is NEVER imported or called anywhere in the app
- No deep-link routing exists for notification taps
- The `app/_layout.tsx` has OAuth and partner deep-link handling but NO notification response listener

### 8.2 Foreground Notification Handling

**Status:** PARTIALLY CONFIGURED

- `Notifications.setNotificationHandler()` is set at module level in `services/notifications.ts:8-16`
- This will show alerts/banners for foreground notifications IF the module is imported
- However, no evidence that `services/notifications.ts` is imported at app startup (no import in `_layout.tsx`)
- **BUG:** The notification handler likely never activates because the service file is never imported at root level

### 8.3 In-App Notification Tray/Inbox

**Status:** NOT IMPLEMENTED

- No notification inbox/tray screen exists
- No notification bell icon or badge count on navigation
- `proactive_messages` table has `is_read`/`is_dismissed` fields suggesting an inbox was planned
- The phase-07 spec (`docs/superpowers/specs/phase-07-smart-notifications.md:282-284`) spec'd `recentNotifications` in a store but it was never built

---

## 9. COMPLIANCE & QUIET HOURS

### 9.1 Quiet Hours

**Status:** UI DISPLAY ONLY — NO ENFORCEMENT

- `notifications-settings.tsx:438-462` — Shows a card: "Notifications are automatically silenced between 10 PM and 6 AM. Adjust in your device's Focus / Do Not Disturb settings."
- This is informational only — defers to OS-level DND
- No server-side quiet-hours enforcement exists in any Edge Function
- The phase-07 spec defined `quiet_hours_start`/`quiet_hours_end` in `smart_notification_preferences` table — this table was NEVER created
- The spec also defined priority levels where `critical` bypasses quiet hours — not implemented

### 9.2 Timezone Handling

**Status:** IMPLEMENTED (server-side)

- `profiles` table has `timezone TEXT DEFAULT 'America/Phoenix'` (line 19)
- `daily-reminder/index.ts:37-42` converts UTC to user local time via `toLocaleString("en-US", { timeZone: tz })`
- `daily-accountability/index.ts:109-112` same approach
- Smart-notification-engine does NOT check timezone — evaluates based on server time

### 9.3 Rate Limiting

**Status:** PARTIAL

- `smart_notification_rules`: per-rule cooldown (`cooldown_hours`, default 24h) — WORKING
- `partner-nudge`: 3 nudges/day per sender→recipient — WORKING
- Global daily cap: SPEC'D (8/day) but NOT IMPLEMENTED
- No per-hour rate limit exists

### 9.4 Per-Category Opt-Out

**Status:** PARTIAL

- `notification_preferences` JSONB has per-category `enabled` booleans
- The `daily-reminder` function checks `prefs.wake_reminder !== false`, `prefs.meal_reminders !== false`, etc.
- The `smart-notification-engine` only evaluates rules where `is_enabled = true`
- However: `daily-accountability` does NOT check user preferences before sending — it always sends if the check window matches

---

## 10. STUBS / PARTIAL IMPLEMENTATIONS

### 10.1 In `services/notifications.ts`

| Line | Finding |
|------|---------|
| 20 | `return null` — Device.isDevice check (expected, not a stub) |
| 32 | `return null` — Permission not granted (expected) |

No TODO/FIXME/placeholder found. Clean implementation.

### 10.2 In `notifications-settings.tsx`

| Line | Finding |
|------|---------|
| 248 | `// In production this would update the push notification subscription` — ACKNOWLEDGED STUB. Global disable has no real effect. |

### 10.3 In `smart-notification-engine/index.ts`

| Line | Finding |
|------|---------|
| 457-463 | `focus_session_reminder` evaluator is a no-op stub: always returns `should_fire: false` |

### 10.4 In `daily-accountability/index.ts`

| Line | Finding |
|------|---------|
| 57 | Comment says "not placeholders" in AI prompt — but this is instructing the AI, not a code stub |

### 10.5 Missing Implementations Referenced in Specs

The phase-07 spec (`docs/superpowers/specs/phase-07-smart-notifications.md`) defined these components that DO NOT EXIST:

| Spec'd Component | Status |
|-----------------|--------|
| `smart_notification_preferences` table | NOT CREATED |
| `smart_notification_rate_limits` table | NOT CREATED |
| `smartNotificationStore` (Zustand) | NOT CREATED |
| `useSmartNotifications` hook | NOT CREATED |
| Notification tap → deep link routing | NOT CREATED |
| Suppress-if-active logic | NOT CREATED |
| `notification_log` extended columns (priority, context_hash, deep_link, etc.) | NOT CREATED |
| Global daily cap enforcement | NOT CREATED |
| Per-type throttle with min gap | NOT CREATED (only cooldown_hours exists) |
| Context hash deduplication | NOT CREATED |
| Dry-run preview mode | NOT CREATED |

---

## CRITICAL BUGS SUMMARY

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 1 | Push token never saved to DB | No call site for `registerForPushNotifications()`/`savePushToken()` | ALL server-side push notifications fail silently (no token to send to) |
| 2 | `notifications` table doesn't exist | 7 Edge Functions insert into non-existent table | Runtime errors on daily-reminder, daily-accountability, partner-nudge, streak-calculator, achievement-evaluator, stake-evaluator, stripe-webhook |
| 3 | No notification tap handler | `addNotificationResponseListener` never used | Users tap notifications → nothing happens |
| 4 | Notification service never imported at root | `services/notifications.ts` sets handler at module level | `setNotificationHandler` may never execute → foreground notifications may not display |
| 5 | `proactive_messages` category CHECK mismatch | `daily-accountability` writes `accountability_morning` etc. | Insert failures (category not in CHECK constraint) |
| 6 | `daily-reminder` reads different pref field names | Uses `wake_reminder_hour` but client saves `wake_up.time` | Server ignores user-configured times, uses defaults |
| 7 | Global toggle is a no-op | `notifications-settings.tsx:248` | Users think they disabled notifications but they keep coming |
| 8 | `daily-accountability` ignores user prefs | Never checks `notification_preferences` | Sends to users who disabled notifications |

---

## ARCHITECTURE DIAGRAM (Current State)

```
CLIENT SIDE                              SERVER SIDE
============                             ===========

[Onboarding Screen]                      [profiles.notification_preferences] (JSONB)
  - Saves prefs to profile               [profiles.expo_push_token] (always NULL - never written)
  - Requests OS permission
  - Does NOT register push token         [daily-reminder] → inserts into "notifications" (TABLE MISSING)
                                         [daily-accountability] → inserts into "notifications" (TABLE MISSING)
[Settings Screen]                                               → inserts into "proactive_messages"
  - Toggle per category                  [smart-notification-engine] → Expo Push API (token always null)
  - Global toggle (no-op)                                            → inserts into "proactive_messages"
  - Test notification (works locally)    [partner-nudge] → inserts into "notifications" (TABLE MISSING)
                                         [streak-calculator] → inserts into "notifications" (TABLE MISSING)
[services/notifications.ts]              [achievement-evaluator] → inserts into "notifications" (TABLE MISSING)
  - registerForPushNotifications (NEVER CALLED)
  - savePushToken (NEVER CALLED)         [smart_notification_rules] table — seeded per user, working
  - scheduleLocalNotification (NEVER CALLED)
  - scheduleDailyNotification (NEVER CALLED)    [notification_log] table — exists, used only by challenge-evaluator
  - addNotificationResponseListener (NEVER CALLED)
  - setNotificationHandler (may never execute)
```

---

## RECOMMENDATIONS (Out of Scope — For Future Sessions)

1. **Fix push token registration:** Import `services/notifications.ts` in `_layout.tsx`, call `registerForPushNotifications()` + `savePushToken()` on auth state change.

2. **Fix table mismatch:** Either create a `notifications` table OR update all 7 Edge Functions to use `notification_log`.

3. **Wire notification tap handler:** Add `addNotificationResponseListener` in root `_layout.tsx` with deep-link routing from push payload `data.route`.

4. **Fix data contract:** Align `daily-reminder` field names with what the client saves (`notification_preferences.wake_up.time` not `wake_reminder_hour`).

5. **Implement global disable:** The global toggle should either unregister the push token or set a flag the server respects.

6. **Fix `proactive_messages` CHECK constraint:** Add `accountability_morning`, `accountability_midday`, `accountability_evening`, `nightly_check_in` to the allowed categories.

7. **Consider the "3-level frequency" system:** It was never built. The coaching tone (4 values) affects AI message style but not volume/timing. A true frequency system would require a `global_daily_cap` per tier and server-side enforcement.

---

_End of audit._
