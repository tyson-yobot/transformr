-- =============================================================================
-- TRANSFORMR -- AI Chat Coach
-- Persistent conversations between the user and the TRANSFORMR AI Coach.
-- Full context (profile, goals, training load, nutrition, sleep, business,
-- supplements, labs, streaks) is attached server-side on each request.
-- =============================================================================

-- 1. Conversations
CREATE TABLE ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  topic TEXT CHECK (topic IN (
    'general',
    'training',
    'nutrition',
    'supplements',
    'sleep',
    'mindset',
    'business',
    'goals',
    'labs',
    'recovery'
  )) DEFAULT 'general',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Messages
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_snapshot JSONB,
  suggestions JSONB,
  disclaimer_type TEXT CHECK (disclaimer_type IN (
    'supplement','lab','nutrition','workout','general','sleep'
  )),
  model TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_ai_chat_conversations_user_id
  ON ai_chat_conversations(user_id);
CREATE INDEX idx_ai_chat_conversations_last_message
  ON ai_chat_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_ai_chat_conversations_pinned
  ON ai_chat_conversations(user_id, pinned, last_message_at DESC)
  WHERE is_archived = false;
CREATE INDEX idx_ai_chat_messages_conversation_id
  ON ai_chat_messages(conversation_id, created_at ASC);
CREATE INDEX idx_ai_chat_messages_user_id
  ON ai_chat_messages(user_id, created_at DESC);

-- 4. Row Level Security
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own conversations"
  ON ai_chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own conversations"
  ON ai_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own conversations"
  ON ai_chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own conversations"
  ON ai_chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users read their own messages"
  ON ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own messages"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own messages"
  ON ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Auto-update conversation metadata when messages are inserted
CREATE OR REPLACE FUNCTION touch_ai_chat_conversation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_conversations
     SET last_message_at = NEW.created_at,
         message_count   = message_count + 1,
         updated_at      = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_messages_touch_conversation
AFTER INSERT ON ai_chat_messages
FOR EACH ROW EXECUTE FUNCTION touch_ai_chat_conversation();
