# Phase 01 — AI Chat Coach

> **Superpower Module Design Specification**
> Status: Ready for Build | Priority: Phase 1

---

## Overview

A persistent AI companion accessible from every screen via a floating action button (FAB). The coach has full context about the user's workout history, nutrition, sleep, goals, and current screen. Uses conversation persistence for continuity across sessions.

---

## Architecture

- **Floating Action Button (ChatFAB)** rendered in root layout, always visible except during auth/onboarding
- **Bottom sheet modal (ChatSheet)** using `react-native-gesture-handler`
- **Edge function** as AI backend with conversation persistence
- **Context caching** per session (6-hour TTL) to reduce token usage
- **Screen-aware suggested prompts**

---

## Database

### `ai_conversations` Table

```sql
CREATE TABLE ai_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL DEFAULT 'New Conversation',
  messages         JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  model_used       TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  token_count      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_recent ON ai_conversations(user_id, created_at DESC) WHERE messages != '[]'::jsonb;

CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_ai_conversations_updated_at();

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select_own" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_insert_own" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_conversations_update_own" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_delete_own" ON ai_conversations FOR DELETE USING (auth.uid() = user_id);
```

**Migration file:** `00027_ai_chat_conversations.sql`

---

## TypeScript Types

Add to `types/ai.ts`:

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AiConversation {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  context_snapshot: AiContextSnapshot | null;
  model_used: string;
  token_count: number;
  created_at: string;
  updated_at: string;
}

interface AiContextSnapshot {
  profile: { display_name: string; goal_direction: string; daily_calorie_target: number };
  recentWorkouts: { name: string; date: string; duration: number }[];
  nutritionSummary: { avg_calories: number; avg_protein: number; days_logged: number };
  sleepSummary: { avg_hours: number; avg_quality: number; recent_nights: number };
  activeGoals: { title: string; progress: number }[];
  currentStreak: number;
  generated_at: string;
}

interface ChatRequest {
  conversationId?: string;
  message: string;
  screenContext?: ScreenContext;
}

interface ChatResponse {
  conversationId: string;
  response: string;
  suggestedActions: SuggestedAction[];
  tokenCount: number;
}

interface SuggestedAction {
  label: string;
  prompt: string;
  icon?: string;
}

type ScreenContext =
  | { screen: 'dashboard' }
  | { screen: 'fitness'; workoutSessionId?: string }
  | { screen: 'nutrition' }
  | { screen: 'sleep' }
  | { screen: 'goals' }
  | { screen: 'profile' }
  | { screen: 'other' };
```

---

## Edge Function: `ai-chat/index.ts`

- **Accepts:** `{ conversationId?, message, screenContext? }`
- **Auth:** User-scoped Supabase client via forwarded `Authorization` header
- **Context loading** (if snapshot stale or missing, 6-hour TTL):
  - 6 parallel queries: profile, workouts (7d), nutrition (3d), sleep (3d), goals, streaks
  - Builds `AiContextSnapshot`, stored on conversation row
- **System prompt** includes: user name, goals, recent activity summary, current screen context
- Uses `claude-sonnet-4-20250514`, `max_tokens: 1024`
- Upserts conversation row (creates if new, appends messages if existing)
- Auto-generates conversation title from first user message
- **Returns:** `{ conversationId, response, suggestedActions, tokenCount }`
- JSON parse with fallback for suggested actions
- **Error handling:** 401 (auth), 400 (bad input), 500 (unexpected)

---

## AI Service: `services/ai/chatCoach.ts`

```typescript
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse>
export async function getConversations(): Promise<AiConversation[]>
export async function getConversation(id: string): Promise<AiConversation>
export async function deleteConversation(id: string): Promise<void>
```

All use the `supabase.functions.invoke('ai-chat', ...)` pattern.

---

## Store: `stores/chatCoachStore.ts`

Zustand with State/Actions pattern + AsyncStorage persistence (partialize excludes transient state).

### State

| Field | Type | Persisted |
|-------|------|-----------|
| `conversations` | `AiConversation[]` | Yes |
| `activeConversation` | `AiConversation \| null` | Yes |
| `messages` | `ChatMessage[]` | Yes |
| `isVisible` | `boolean` | No |
| `isLoading` | `boolean` | No |
| `streamingMessage` | `string` | No |
| `suggestedActions` | `SuggestedAction[]` | No |
| `unreadCount` | `number` | Yes |
| `error` | `string \| null` | No |

### Actions

| Action | Description |
|--------|-------------|
| `openChat()` | Show chat sheet |
| `closeChat()` | Hide chat sheet |
| `sendMessage(request)` | Optimistic append user message, append assistant on success |
| `startNewConversation()` | Create fresh conversation |
| `loadConversation(conv)` | Switch to existing conversation |
| `removeConversation(id)` | Delete conversation |
| `fetchConversations()` | Load all conversations from backend |
| `clearError()` | Dismiss error state |
| `reset()` | Full state reset |

---

## Hook: `hooks/useChatCoach.ts`

Composes the store with screen context via `usePathname()`.

- Auto-injects `screenContext` into `sendMessage` calls
- Returns: all store state + actions + derived `screenContext`

---

## Screen Context Utility: `utils/screenContext.ts`

```typescript
pathnameToScreenContext(pathname: string): ScreenContext
```

Maps Expo Router pathnames to screen contexts.

---

## Components

### ChatFAB (`components/chat/ChatFAB.tsx`)

- Floating button positioned bottom-right, above tab bar (`60 + insets.bottom + 16`)
- Animated press with `react-native-reanimated` spring
- Unread count badge (red circle, `"9+"` overflow)
- Hidden when ChatSheet is visible
- Haptic feedback on press

### ChatSheet (`components/chat/ChatSheet.tsx`)

- Full-screen `Modal` with `presentationStyle="pageSheet"`
- **Header:** History toggle, "AI Coach" title, Close button
- **Message list:** `FlatList` with auto-scroll to bottom
- **Streaming indicator:** synthetic `ChatBubble` with `isStreaming=true`
- **Conversation history view:** accessible via header button
- **Empty state:** robot emoji + welcome message
- **Error banner:** dismissible, red background
- **Input bar:** `TextInput` + send button, `KeyboardAvoidingView`, multiline, 1000 char max
- **Suggested prompts strip** above input

### ChatBubble (`components/chat/ChatBubble.tsx`)

- **User messages:** right-aligned, `accent.primary` background
- **Assistant messages:** left-aligned, `background.secondary`
- Streaming animation: 3-dot pulse using Reanimated
- `FadeInDown` entrance animation
- Markdown support in assistant messages (bold, lists)
- `useTheme()` for all colors, no hardcoded values

### SuggestedPrompts (`components/chat/SuggestedPrompts.tsx`)

- Horizontal `ScrollView` of chip buttons
- Screen-specific defaults:

| Screen | Prompts |
|--------|---------|
| Dashboard | "Quick wins", "Daily check-in", "Progress update" |
| Fitness | "Good for goals?", "Suggest workout", "Rest or train?" |
| Nutrition | "On track?", "What to eat next", "Protein gap" |
| Sleep | "Improve sleep", "Pattern analysis", "Bedtime?" |
| Goals | "Goal progress", "Priority goal", "Stuck?" |

- AI-generated suggestions take priority over defaults
- Tapping a chip sends the prompt immediately

---

## Root Layout Integration

Modify `app/_layout.tsx`:

- Import `ChatFAB` + `ChatSheet`
- Use `useSegments()` to detect auth flow
- Render FAB + Sheet as siblings of `<Slot />`, hidden during auth/onboarding

---

## Deep Link Support

New file `app/chat.tsx`:

- **Route:** `transformr://chat?prompt=...`
- Redirects to dashboard, opens chat, sends prompt if provided

---

## Data Flow

```
User taps ChatFAB
  -> openChat()
  -> ChatSheet renders (Modal)

User sends message
  -> optimistic append
  -> supabase.functions.invoke('ai-chat')
    -> Edge function: auth
    -> load/cache context
    -> build prompt
    -> callClaude
    -> upsert conversation
  -> Return response
  -> store updates
  -> ChatBubble renders
  -> auto-scroll
```

---

## Build Sequence

| Step | Task | File |
|------|------|------|
| 1 | Database migration | `00027_ai_chat_conversations.sql` |
| 2 | TypeScript types | Append to `types/ai.ts` |
| 3 | Edge function (deploy + test with curl) | `ai-chat/index.ts` |
| 4 | AI service | `services/ai/chatCoach.ts` |
| 5 | Screen context utility | `utils/screenContext.ts` |
| 6 | Zustand store | `stores/chatCoachStore.ts` |
| 7 | React hook | `hooks/useChatCoach.ts` |
| 8 | Components (leaf to root) | `ChatBubble` -> `SuggestedPrompts` -> `ChatSheet` -> `ChatFAB` |
| 9 | Root layout integration | `_layout.tsx` |
| 10 | Deep link handler | `app/chat.tsx` |

---

## Critical Details

| Concern | Detail |
|---------|--------|
| Context caching | 6-hour TTL stored on conversation row, not a separate cache table |
| Token budget | `max_tokens` 1024, tracked via `token_count` column |
| Optimistic UI | User message appears instantly, removed on failure |
| FAB positioning | `TAB_BAR_HEIGHT(60) + insets.bottom + FAB_MARGIN(16)` |
| State persistence | Only `conversations`, `messages`, and `unreadCount` persist across restarts |
| Security | All queries run through user-scoped Supabase client with RLS |
| Error degradation | "AI temporarily unavailable" message, never blocks core app |

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/00027_ai_chat_conversations.sql` | DDL + RLS |
| `supabase/functions/ai-chat/index.ts` | Edge function |
| `apps/mobile/services/ai/chatCoach.ts` | Service layer |
| `apps/mobile/stores/chatCoachStore.ts` | Zustand store |
| `apps/mobile/hooks/useChatCoach.ts` | React hook |
| `apps/mobile/utils/screenContext.ts` | Pathname mapper |
| `apps/mobile/components/chat/ChatBubble.tsx` | Message bubble |
| `apps/mobile/components/chat/SuggestedPrompts.tsx` | Prompt chips |
| `apps/mobile/components/chat/ChatSheet.tsx` | Chat modal |
| `apps/mobile/components/chat/ChatFAB.tsx` | Floating button |
| `apps/mobile/app/chat.tsx` | Deep link handler |

## Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/types/ai.ts` | Add 9 new interfaces |
| `apps/mobile/app/_layout.tsx` | Import ChatFAB + ChatSheet, conditional render |
