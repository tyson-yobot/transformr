-- ═══════════════════════════════════════════════════════════════
-- REFERRAL, REWARDS & BILLING PIPELINE
-- Single migration — all tables, RLS, functions
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- SECTION 1: REFERRAL TRACKING
-- ───────────────────────────────────────────────────────────────

-- Referral codes: one unique shareable code per user
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    custom_slug VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT unique_user_referral UNIQUE (user_id)
);

-- Referrals: who referred whom + retention tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    referred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_tier VARCHAR(20),
    subscription_start TIMESTAMPTZ,
    is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    consecutive_months INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    activity_count_30d INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    qualified_at TIMESTAMPTZ,
    CONSTRAINT unique_referral UNIQUE (referred_id),
    CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 2: REWARDS
-- ───────────────────────────────────────────────────────────────

-- Rewards ledger: every reward earned across all 5 programs
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_type VARCHAR(30) NOT NULL,
    source VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    free_months INTEGER DEFAULT 0,
    tier_granted VARCHAR(20),
    discount_percent NUMERIC(5,2) DEFAULT 0,
    credit_amount NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'earned',
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    triggered_by_referral_id UUID REFERENCES referrals(id),
    triggered_by_milestone VARCHAR(50),
    triggered_by_squad_id UUID
);

-- Milestone gifts: earned from achievements, giftable to others
CREATE TABLE IF NOT EXISTS milestone_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gifter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id),
    milestone_type VARCHAR(50) NOT NULL,
    gift_tier VARCHAR(20) NOT NULL,
    gift_months INTEGER NOT NULL DEFAULT 1,
    gift_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 3: ACCOUNTABILITY SQUADS
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    member_count INTEGER NOT NULL DEFAULT 1,
    active_member_count INTEGER NOT NULL DEFAULT 1,
    current_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    consecutive_months_all_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    consecutive_months INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_squad_member UNIQUE (squad_id, user_id)
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 4: CREATOR / REVENUE SHARE
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'standard',
    revenue_share_percent NUMERIC(5,2) NOT NULL DEFAULT 15.0,
    total_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
    pending_payout NUMERIC(10,2) NOT NULL DEFAULT 0,
    last_payout_at TIMESTAMPTZ,
    custom_landing_page BOOLEAN NOT NULL DEFAULT FALSE,
    active_referral_count INTEGER NOT NULL DEFAULT 0,
    lifetime_referral_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_creator UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS revenue_share_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_referral_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
    share_percent NUMERIC(5,2) NOT NULL,
    payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    referral_count INTEGER NOT NULL DEFAULT 0,
    line_items JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'calculated',
    payment_method VARCHAR(30),
    stripe_transfer_id VARCHAR(100),
    paid_at TIMESTAMPTZ,
    qb_synced BOOLEAN NOT NULL DEFAULT FALSE,
    qb_bill_id VARCHAR(100),
    qb_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by VARCHAR(50),
    approved_at TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 5: BILLING PIPELINE (Stripe ↔ QuickBooks)
-- ───────────────────────────────────────────────────────────────

-- Master billing ledger: SINGLE SOURCE OF TRUTH for all money
CREATE TABLE IF NOT EXISTS billing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(40) NOT NULL,
    gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    referral_discount NUMERIC(10,2) DEFAULT 0,
    squad_discount NUMERIC(10,2) DEFAULT 0,
    gift_discount NUMERIC(10,2) DEFAULT 0,
    promo_discount NUMERIC(10,2) DEFAULT 0,
    subscription_tier VARCHAR(20),
    billing_period VARCHAR(20),
    reward_id UUID REFERENCES referral_rewards(id),
    squad_id UUID REFERENCES squads(id),
    gift_id UUID REFERENCES milestone_gifts(id),
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    stripe_invoice_id VARCHAR(100),
    stripe_payment_intent_id VARCHAR(100),
    stripe_coupon_id VARCHAR(100),
    stripe_credit_note_id VARCHAR(100),
    qb_synced BOOLEAN NOT NULL DEFAULT FALSE,
    qb_invoice_id VARCHAR(100),
    qb_journal_entry_id VARCHAR(100),
    qb_synced_at TIMESTAMPTZ,
    qb_sync_error TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    notes TEXT
);

-- Stripe customer mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(100) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(100),
    subscription_status VARCHAR(30),
    current_tier VARCHAR(20),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    active_coupon_id VARCHAR(100),
    active_discount_percent NUMERIC(5,2) DEFAULT 0,
    free_months_remaining INTEGER DEFAULT 0,
    is_lifetime_pro BOOLEAN DEFAULT FALSE,
    referred_by UUID REFERENCES profiles(id),
    referrer_revenue_share_percent NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_stripe_user UNIQUE (user_id)
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 6: SHARE & AUDIT TRACKING
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    share_type VARCHAR(30) NOT NULL,
    platform VARCHAR(30),
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicks INTEGER NOT NULL DEFAULT 0,
    signups INTEGER NOT NULL DEFAULT 0,
    subscriptions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS billing_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type VARCHAR(40) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'warning',
    user_id UUID REFERENCES profiles(id),
    description TEXT NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(50),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- SECTION 7: INDEXES
-- ───────────────────────────────────────────────────────────────

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id, status);
CREATE INDEX idx_squad_members_user ON squad_members(user_id);
CREATE INDEX idx_squad_members_squad ON squad_members(squad_id, is_active);
CREATE INDEX idx_milestone_gifts_gifter ON milestone_gifts(gifter_id);
CREATE INDEX idx_milestone_gifts_status ON milestone_gifts(status);
CREATE INDEX idx_share_events_user ON share_events(user_id);
CREATE INDEX idx_creator_profiles_user ON creator_profiles(user_id);
CREATE INDEX idx_billing_ledger_user ON billing_ledger(user_id);
CREATE INDEX idx_billing_ledger_status ON billing_ledger(status);
CREATE INDEX idx_billing_ledger_stripe ON billing_ledger(stripe_invoice_id);
CREATE INDEX idx_billing_ledger_qb ON billing_ledger(qb_synced);
CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_payouts_creator ON revenue_share_payouts(creator_id, status);
CREATE INDEX idx_audit_log_type ON billing_audit_log(audit_type, resolved);
CREATE INDEX idx_audit_log_severity ON billing_audit_log(severity, resolved);

-- ───────────────────────────────────────────────────────────────
-- SECTION 8: ROW-LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Referral codes
CREATE POLICY referral_codes_select ON referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY referral_codes_insert ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY referral_codes_update ON referral_codes FOR UPDATE USING (auth.uid() = user_id);

-- Referrals
CREATE POLICY referrals_select ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY referrals_insert ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Rewards
CREATE POLICY rewards_select ON referral_rewards FOR SELECT USING (auth.uid() = user_id);

-- Squads
CREATE POLICY squads_select ON squads FOR SELECT USING (EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squads.id AND user_id = auth.uid()));
CREATE POLICY squads_insert ON squads FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY squads_update ON squads FOR UPDATE USING (auth.uid() = creator_id);

-- Squad members
CREATE POLICY squad_members_select ON squad_members FOR SELECT USING (EXISTS (SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid()));
CREATE POLICY squad_members_insert ON squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Creator profiles
CREATE POLICY creator_select ON creator_profiles FOR SELECT USING (auth.uid() = user_id);

-- Milestone gifts
CREATE POLICY gifts_select ON milestone_gifts FOR SELECT USING (auth.uid() = gifter_id OR auth.uid() = recipient_id);
CREATE POLICY gifts_insert ON milestone_gifts FOR INSERT WITH CHECK (auth.uid() = gifter_id);
CREATE POLICY gifts_update ON milestone_gifts FOR UPDATE USING (auth.uid() = gifter_id OR auth.uid() = recipient_id);

-- Share events
CREATE POLICY shares_select ON share_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY shares_insert ON share_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Billing ledger
CREATE POLICY ledger_select ON billing_ledger FOR SELECT USING (auth.uid() = user_id);

-- Stripe customers
CREATE POLICY stripe_select ON stripe_customers FOR SELECT USING (auth.uid() = user_id);

-- Revenue share payouts
CREATE POLICY payouts_select ON revenue_share_payouts FOR SELECT USING (auth.uid() = creator_id);

-- Audit log: no user-level RLS — accessed via service role in Edge Functions only

-- ───────────────────────────────────────────────────────────────
-- SECTION 9: HELPER FUNCTIONS
-- ───────────────────────────────────────────────────────────────

-- Count active referrals (qualified: 2+ months, 3+ activity in 30d)
CREATE OR REPLACE FUNCTION get_active_referral_count(check_user UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) FROM referrals
        WHERE referrer_id = check_user
        AND status = 'active'
        AND consecutive_months >= 2
        AND activity_count_30d >= 3
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Transformation Circle tier
CREATE OR REPLACE FUNCTION get_referral_tier(check_user UUID)
RETURNS TABLE(tier_name TEXT, active_count INTEGER, next_tier TEXT, referrals_to_next INTEGER) AS $$
DECLARE
    count INTEGER;
BEGIN
    count := get_active_referral_count(check_user);
    IF count >= 25 THEN
        RETURN QUERY SELECT 'lifetime_pro'::TEXT, count, 'max'::TEXT, 0;
    ELSIF count >= 10 THEN
        RETURN QUERY SELECT 'partners_month'::TEXT, count, 'lifetime_pro'::TEXT, 25 - count;
    ELSIF count >= 5 THEN
        RETURN QUERY SELECT 'elite_month'::TEXT, count, 'partners_month'::TEXT, 10 - count;
    ELSIF count >= 3 THEN
        RETURN QUERY SELECT 'pro_month'::TEXT, count, 'elite_month'::TEXT, 5 - count;
    ELSE
        RETURN QUERY SELECT 'none'::TEXT, count, 'pro_month'::TEXT, 3 - count;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate squad discount
CREATE OR REPLACE FUNCTION get_squad_discount(check_squad UUID)
RETURNS NUMERIC AS $$
DECLARE
    active_count INTEGER;
    months_active INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count FROM squad_members WHERE squad_id = check_squad AND is_active = TRUE;
    SELECT consecutive_months_all_active INTO months_active FROM squads WHERE id = check_squad;
    IF months_active < 3 THEN RETURN 0; END IF;
    IF active_count >= 7 THEN RETURN 40.0;
    ELSIF active_count >= 5 THEN RETURN 30.0;
    ELSIF active_count >= 3 THEN RETURN 20.0;
    ELSE RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate effective discount for a user (stacking rules)
CREATE OR REPLACE FUNCTION calculate_effective_discount(check_user UUID)
RETURNS TABLE(effective_percent NUMERIC, discount_source TEXT, free_months_remaining INTEGER, is_lifetime BOOLEAN, breakdown JSONB) AS $$
DECLARE
    sc stripe_customers%ROWTYPE;
    squad_pct NUMERIC := 0;
    squad_id_val UUID;
BEGIN
    SELECT * INTO sc FROM stripe_customers WHERE user_id = check_user;

    -- Lifetime Pro overrides everything
    IF sc.is_lifetime_pro THEN
        RETURN QUERY SELECT 100.0::NUMERIC, 'lifetime_pro'::TEXT, 0, TRUE, '{"lifetime_pro":true}'::JSONB;
        RETURN;
    END IF;

    -- Free months override squad discount
    IF sc.free_months_remaining > 0 THEN
        RETURN QUERY SELECT 100.0::NUMERIC, 'free_month'::TEXT, sc.free_months_remaining, FALSE, jsonb_build_object('free_months', sc.free_months_remaining);
        RETURN;
    END IF;

    -- Squad discount
    SELECT sm.squad_id INTO squad_id_val FROM squad_members sm WHERE sm.user_id = check_user AND sm.is_active = TRUE LIMIT 1;
    IF squad_id_val IS NOT NULL THEN
        squad_pct := get_squad_discount(squad_id_val);
    END IF;

    RETURN QUERY SELECT squad_pct, CASE WHEN squad_pct > 0 THEN 'squad_discount' ELSE 'none' END::TEXT, 0, FALSE, jsonb_build_object('squad_discount', squad_pct);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master reconciliation health check
CREATE OR REPLACE FUNCTION run_billing_reconciliation()
RETURNS TABLE(check_name TEXT, status TEXT, expected_value TEXT, actual_value TEXT, discrepancy BOOLEAN) AS $$
BEGIN
    -- Rewards earned vs applied
    RETURN QUERY SELECT 'rewards_earned_vs_applied'::TEXT,
        CASE WHEN e = a + p THEN 'OK' ELSE 'MISMATCH' END,
        e::TEXT, (a::TEXT || ' applied + ' || p::TEXT || ' pending'), (e != a + p)
    FROM (SELECT COUNT(*) FILTER (WHERE status IN ('earned','applied','redeemed')) as e,
        COUNT(*) FILTER (WHERE status = 'applied') as a,
        COUNT(*) FILTER (WHERE status = 'earned') as p FROM referral_rewards) x;

    -- Billing ledger vs QB sync
    RETURN QUERY SELECT 'ledger_vs_qb_sync'::TEXT,
        CASE WHEN c = s THEN 'OK' ELSE 'BEHIND' END, c::TEXT, s::TEXT, (c != s)
    FROM (SELECT COUNT(*) FILTER (WHERE status = 'completed') as c,
        COUNT(*) FILTER (WHERE status = 'completed' AND qb_synced = TRUE) as s FROM billing_ledger) x;

    -- Pending creator payouts > 30 days
    RETURN QUERY SELECT 'overdue_payouts'::TEXT,
        CASE WHEN n = 0 THEN 'OK' ELSE n::TEXT || ' overdue' END, '0', n::TEXT, (n > 0)
    FROM (SELECT COUNT(*) as n FROM revenue_share_payouts WHERE status = 'approved' AND created_at < NOW() - INTERVAL '30 days') x;

    -- Open critical/error audit issues
    RETURN QUERY SELECT 'open_audit_issues'::TEXT,
        CASE WHEN cr + er = 0 THEN 'OK' ELSE 'ISSUES' END,
        '0 critical, 0 errors', cr::TEXT || ' critical, ' || er::TEXT || ' errors', (cr + er > 0)
    FROM (SELECT COUNT(*) FILTER (WHERE severity = 'critical' AND resolved = FALSE) as cr,
        COUNT(*) FILTER (WHERE severity = 'error' AND resolved = FALSE) as er FROM billing_audit_log) x;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
