-- =============================================================================
-- Migration 00043 — Subscription tiers and feature gate cache
-- =============================================================================

-- Subscription tiers enum
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'elite', 'partners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  billing_interval billing_interval,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  -- Partners tier: link two users
  partner_subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON subscriptions(user_id)
  WHERE status IN ('active', 'trialing');

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Feature gate cache (denormalized for fast reads)
CREATE TABLE IF NOT EXISTS user_feature_gates (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  gates JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_feature_gates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own gates"
    ON user_feature_gates FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-update timestamp trigger (reuse or create)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sync subscription tier changes back to profiles.subscription_tier
CREATE OR REPLACE FUNCTION sync_subscription_tier_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active', 'trialing') THEN
    UPDATE profiles
      SET subscription_tier = NEW.tier::TEXT
      WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'past_due', 'paused') THEN
    -- Downgrade to free when subscription lapses
    UPDATE profiles
      SET subscription_tier = 'free'
      WHERE id = NEW.user_id
        AND subscription_tier = NEW.tier::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subscriptions_sync_profile_tier ON subscriptions;
CREATE TRIGGER subscriptions_sync_profile_tier
  AFTER INSERT OR UPDATE OF status, tier ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier_to_profile();
