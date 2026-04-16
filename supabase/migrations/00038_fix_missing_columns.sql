-- =============================================================================
-- Migration 00038: Fix missing/mismatched columns on profiles
-- Resolves the gamification_style → coaching_tone rename, adds subscription
-- tier tracking, and adds gamification XP/level columns.
-- =============================================================================

-- 1. coaching_tone — client code writes this column; 00036 added gamification_style
--    instead. Add coaching_tone (canonical name), copy data from gamification_style.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'coaching_tone'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN coaching_tone TEXT DEFAULT 'motivational'
      CHECK (coaching_tone IN ('drill_sergeant', 'motivational', 'balanced', 'calm'));

    -- Back-fill from gamification_style if that column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'gamification_style'
    ) THEN
      UPDATE profiles
        SET coaching_tone = gamification_style
        WHERE gamification_style IS NOT NULL
          AND gamification_style IN ('drill_sergeant', 'motivational', 'balanced', 'calm');
    END IF;
  END IF;
END $$;

-- 2. Subscription tier tracking (Phase 3 — Monetization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN subscription_tier TEXT DEFAULT 'free'
      CHECK (subscription_tier IN ('free', 'pro', 'elite', 'partners'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- 3. Gamification XP and level tracking (Module 13)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN current_level INTEGER DEFAULT 1;
    ALTER TABLE profiles ADD COLUMN gamification_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 4. XP transaction log (Module 13)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN (
                 'workout_completed', 'pr_achieved', 'habit_completed',
                 'streak_milestone', 'meal_logged', 'weight_logged',
                 'journal_entry', 'challenge_completed', 'achievement_unlocked',
                 'partner_workout', 'daily_checkin'
               )),
  reference_id UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_user_date
  ON xp_transactions(user_id, created_at DESC);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'xp_transactions' AND policyname = 'Users manage own xp'
  ) THEN
    CREATE POLICY "Users manage own xp" ON xp_transactions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Proactive messages table (used by Module 7 proactive-wellness and
--    reorder-predictor; may already exist — guard with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS proactive_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category       TEXT NOT NULL CHECK (category IN (
                   'reorder', 'nutrition', 'workout', 'sleep', 'mood',
                   'habit', 'goal', 'business', 'weather', 'general'
                 )),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  action_type    TEXT,
  action_payload JSONB,
  is_read        BOOLEAN DEFAULT false,
  is_dismissed   BOOLEAN DEFAULT false,
  priority       INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proactive_messages_user_unread
  ON proactive_messages(user_id, is_read, is_dismissed, created_at DESC);

ALTER TABLE proactive_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'proactive_messages' AND policyname = 'Users manage own messages'
  ) THEN
    CREATE POLICY "Users manage own messages" ON proactive_messages
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
