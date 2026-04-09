# Phase 07 -- AI Smart Notification System

## Overview

The AI Smart Notification system replaces static scheduled reminders with context-aware, AI-generated push notifications. A server-side cron runs every 30 minutes, evaluates each user's current state across all tracked dimensions, and generates personalized messages delivered via Expo Push Notifications. Client-side routing handles deep linking into the relevant screen on tap.

---

## Architecture

```
┌──────────────┐    every 30 min    ┌───────────────────────────┐
│  pg_cron     │ ──────────────────>│  ai-smart-notification    │
│  (Supabase)  │                    │  Edge Function            │
└──────────────┘                    │                           │
                                    │  1. Query eligible users  │
                                    │  2. Assemble context      │
                                    │  3. Evaluate triggers     │
                                    │  4. Generate AI copy      │
                                    │  5. Send via Expo Push    │
                                    └───────────────────────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │  Expo Push Service │
                                    └───────────────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │  Device            │
                                    │  (deep link route) │
                                    └───────────────────┘
```

---

## Notification Types

| # | Type | Cron Window (local) | Max/Day | Min Gap | Priority |
|---|------|-------------------|---------|---------|----------|
| 1 | `morning_brief` | 06:00 - 09:00 | 1 | -- | informational |
| 2 | `meal_reminder` | 07:00 - 21:00 | 3 | 2.5 h | coaching |
| 3 | `water_reminder` | 08:00 - 22:00 | 4 | 1.5 h | coaching |
| 4 | `workout_reminder` | 06:00 - 20:00 | 1 | -- | coaching |
| 5 | `food_log_nudge` | 10:00 - 22:00 | 2 | 3 h | informational |
| 6 | `sleep_reminder` | 20:00 - 23:00 | 1 | -- | coaching |
| 7 | `weekly_review` | 09:00 - 12:00 (Sun) | 1 | -- | informational |
| 8 | `streak_risk` | 16:00 - 21:00 | 1 | -- | critical |
| 9 | `pr_celebration` | any | 1 | -- | critical |

### Priority Levels

| Level | Behavior |
|-------|----------|
| `critical` | Bypasses quiet hours, always delivered |
| `coaching` | Respects quiet hours, contributes to daily cap |
| `informational` | Respects quiet hours, lowest delivery priority, dropped first when near cap |

---

## AI Prompt Templates

Each notification type has a dedicated system prompt fed to the LLM along with assembled context.

### System Prompt (shared preamble)

```
You are TRANSFORMR, an AI fitness coach. Write a single push notification.
Rules:
- Max 140 characters for the body.
- Warm, direct, motivational tone. No emoji spam (max 1 emoji).
- Reference specific user data when available (e.g., streak count, macro shortfall, PR weight).
- Never guilt-trip. Never use exclamation marks more than once.
- Return JSON: { "title": "...", "body": "..." }
```

### Per-Type User Prompts (examples)

**morning_brief:**
```
Summarize the user's day ahead: {scheduledWorkout}, current streak ({streakDays} days),
yesterday's macro compliance ({macroSummary}), today's weather ({weatherSummary}).
Give them one thing to focus on.
```

**meal_reminder:**
```
The user's next expected meal is {mealType}. They have consumed {caloriesEaten} of
{caloriesTarget} kcal today. Protein is at {proteinEaten}g / {proteinTarget}g.
Remind them to eat and hit their protein target.
```

**streak_risk:**
```
The user has a {streakDays}-day streak that will break at midnight if they don't
{missingAction}. This is urgent. Be encouraging but clear about the deadline.
```

**pr_celebration:**
```
The user just set a personal record: {exerciseName} at {weight} {unit} for {reps} reps.
Celebrate this achievement.
```

_(Remaining types follow the same pattern with relevant context variables.)_

---

## Throttling

### Per-Type Throttle

Each notification type enforces:
- **Daily cap** (`max/day` column above).
- **Minimum gap** between consecutive sends of the same type.

### Global Daily Cap

- Default: **8 notifications per user per day**.
- User-configurable in notification preferences (range 3 - 15).

### Context Hash Deduplication

A SHA-256 hash of `(user_id, notification_type, date, context_snapshot)` is stored. If the same hash already exists in `notification_log`, the notification is suppressed to avoid sending duplicate content when the cron fires multiple times within the same context window.

---

## Database

### Extend `notification_log`

```sql
ALTER TABLE notification_log
  ADD COLUMN notification_type  text,
  ADD COLUMN priority           text CHECK (priority IN ('critical', 'coaching', 'informational')),
  ADD COLUMN context_hash       text,
  ADD COLUMN ai_prompt_tokens   integer,
  ADD COLUMN ai_completion_tokens integer,
  ADD COLUMN expo_ticket_id     text,
  ADD COLUMN deep_link          text;

CREATE INDEX idx_notification_log_type_day ON notification_log (user_id, notification_type, created_at);
CREATE UNIQUE INDEX idx_notification_log_dedup ON notification_log (context_hash);
```

### `smart_notification_rate_limits`

```sql
CREATE TABLE smart_notification_rate_limits (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  last_sent_at      timestamptz NOT NULL,
  sent_today        smallint NOT NULL DEFAULT 0,
  reset_date        date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, notification_type)
);
```

### `smart_notification_preferences`

```sql
CREATE TABLE smart_notification_preferences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled           boolean NOT NULL DEFAULT true,
  global_daily_cap  smallint NOT NULL DEFAULT 8,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end   time DEFAULT '07:00',
  disabled_types    text[] DEFAULT '{}',        -- e.g. {'weekly_review', 'food_log_nudge'}
  timezone          text NOT NULL DEFAULT 'America/New_York',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

---

## Edge Function: `ai-smart-notification/index.ts`

### Flow

```
1. Query all users with smart notifications enabled.
2. For each user (batched, max 50 concurrent):
   a. Check current local time against cron windows.
   b. Assemble context (6 parallel Supabase queries).
   c. For each eligible notification type:
      i.   Check rate limits (per-type + global cap).
      ii.  Compute context hash; skip if duplicate.
      iii. Check suppress-if-active flag.
      iv.  Build prompt from template + context.
      v.   Call LLM (Claude) for title + body.
      vi.  Send via Expo Push.
      vii. Log to notification_log + update rate_limits.
3. Return summary: { processed: N, sent: N, skipped: N, errors: N }
```

### Dry-Run Preview Mode

```
POST /ai-smart-notification
Body: { dry_run: true, user_id: "..." }

Returns the notifications that *would* be sent without actually sending them.
Useful for testing prompts and verifying throttle logic.
```

### Context Assembly (6 Parallel Queries)

| # | Query | Returns |
|---|-------|---------|
| 1 | Nutrition logs (today) | caloriesEaten, proteinEaten, meals logged, macro compliance |
| 2 | Water logs (today) | oz consumed, target, percentage |
| 3 | Workouts (today + scheduled) | completed today, scheduled workout details, last workout date |
| 4 | Sleep (last night) | hours, quality score, sleep/wake times |
| 5 | Weekly aggregates | streak count, weekly workout count, avg compliance |
| 6 | Personal records (last 7 days) | any new PRs with exercise name, weight, reps |

---

## Deep Link Mapping

| Notification Type | Deep Link Route |
|-------------------|----------------|
| `morning_brief` | `/dashboard` |
| `meal_reminder` | `/nutrition/log` |
| `water_reminder` | `/nutrition/water` |
| `workout_reminder` | `/workout/today` |
| `food_log_nudge` | `/nutrition/log` |
| `sleep_reminder` | `/sleep` |
| `weekly_review` | `/progress/weekly` |
| `streak_risk` | `/dashboard` |
| `pr_celebration` | `/progress/prs` |

---

## Suppress-If-Active Flag

If the user currently has the app in the foreground on the screen that the notification would deep link to, the notification is suppressed. This is implemented via:

1. The client reports its current active screen to the store.
2. The Edge Function checks a `last_active_screen` field (updated via a lightweight heartbeat or on screen focus).
3. If the screen matches the deep link target and `last_active_at` is within 5 minutes, the notification is skipped.

---

## Push Payload Structure

```json
{
  "to": "ExponentPushToken[...]",
  "title": "AI-generated title",
  "body": "AI-generated body (max 140 chars)",
  "data": {
    "type": "meal_reminder",
    "deep_link": "/nutrition/log",
    "notification_id": "uuid"
  },
  "ttl": 3600,
  "priority": "high",
  "sound": "default",
  "channelId": "coaching"
}
```

### TTL Per Priority

| Priority | TTL |
|----------|-----|
| `critical` | 86400 (24 h) |
| `coaching` | 3600 (1 h) |
| `informational` | 1800 (30 min) |

---

## Store: `smartNotificationStore`

Zustand store with MMKV persistence.

```ts
interface SmartNotificationStore {
  preferences: SmartNotificationPreferences;
  recentNotifications: NotificationLogEntry[];    // last 20, for in-app history
  activeScreen: string | null;

  setPreferences: (prefs: Partial<SmartNotificationPreferences>) => void;
  setActiveScreen: (screen: string | null) => void;
  addNotification: (entry: NotificationLogEntry) => void;
  markRead: (id: string) => void;
}
```

---

## Hook: `useSmartNotifications`

```ts
function useSmartNotifications() {
  // Registers Expo Notifications listener for incoming pushes.
  // On notification tap: extracts deep_link from data, navigates via router.push().
  // Updates activeScreen on screen focus/blur for suppress-if-active.
  // Returns: { preferences, updatePreferences, recentNotifications, markRead }
}
```

### Notification Tap Routing

```ts
Notifications.addNotificationResponseReceivedListener((response) => {
  const deepLink = response.notification.request.content.data?.deep_link;
  if (deepLink) {
    router.push(deepLink);
  }
});
```

---

## Build Sequence

| Phase | Description |
|-------|-------------|
| 1 | Database migrations: extend `notification_log`, create `smart_notification_rate_limits` + `smart_notification_preferences` |
| 2 | Edge Function scaffold: context assembly + rate-limit logic + dry_run mode |
| 3 | AI prompt templates + LLM integration for all 9 notification types |
| 4 | Expo Push delivery + TTL + channel configuration |
| 5 | Client-side: `smartNotificationStore`, `useSmartNotifications` hook, deep link routing |
| 6 | Suppress-if-active logic, notification preferences UI, cron scheduling |
