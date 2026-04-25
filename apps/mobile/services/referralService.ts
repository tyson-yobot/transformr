// =============================================================================
// TRANSFORMR — Referral Service
//
// Handles referral codes, transformation circles, squad pricing,
// milestone gifts, share tracking, and creator profiles.
// All data flows through Supabase tables and Edge Functions.
// =============================================================================

import { supabase } from './supabase';

// =============================================================================
// Types
// =============================================================================

export interface TierInfo {
  tier: 'starter' | 'builder' | 'leader' | 'legend';
  activeReferrals: number;
  nextTierThreshold: number;
  discountPercent: number;
}

export interface RewardParams {
  months?: number;
  discountPercent?: number;
  badge?: string;
  description?: string;
}

export interface MilestoneGift {
  id: string;
  userId: string;
  milestoneType: string;
  rewardType: string;
  rewardMonths: number;
  badge: string | null;
  giftCode: string;
  status: 'available' | 'sent' | 'claimed' | 'expired';
  recipientEmail: string | null;
  recipientId: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreatorProfile {
  userId: string;
  displayName: string;
  activeReferrals: number;
  totalEarnings: number;
  tier: string;
  isEligible: boolean;
  joinedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  code: string;
  status: 'pending' | 'active' | 'churned';
  createdAt: string;
}

export interface Reward {
  id: string;
  userId: string;
  rewardType: string;
  source: string;
  months: number | null;
  discountPercent: number | null;
  badge: string | null;
  status: 'pending' | 'applied' | 'expired';
  createdAt: string;
}

interface SquadRow {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface ShareEvent {
  id: string;
  user_id: string;
  share_type: string;
  platform: string;
  created_at: string;
}

// =============================================================================
// Word banks for memorable referral codes
// =============================================================================

const FIRST_WORDS: readonly string[] = [
  'IRON', 'TITAN', 'BEAST', 'BLAZE', 'SURGE', 'ALPHA', 'OMEGA', 'PEAK',
  'STEEL', 'FORCE', 'GRIND', 'SHRED', 'POWER', 'ELITE', 'PRIME', 'ROGUE',
  'FURY', 'APEX', 'BOLD', 'SPARK',
];

const SECOND_WORDS: readonly string[] = [
  'FIT', 'LIFT', 'PUSH', 'PUMP', 'BURN', 'FLEX', 'REPS', 'SETS',
  'GAIN', 'CORE', 'LEAN', 'BULK', 'TONE', 'PACE', 'GRIT', 'FUEL',
  'RISE', 'DASH', 'EDGE', 'FORM',
];

const SUFFIX_CHARS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// =============================================================================
// Helpers
// =============================================================================

function pickRandom<T>(arr: readonly T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  const item = arr[index];
  if (item === undefined) {
    throw new Error('pickRandom called on empty array');
  }
  return item;
}

function randomSuffix(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return result;
}

function generateGiftCode(): string {
  return `GIFT-${randomSuffix(4)}-${randomSuffix(4)}`;
}

function generateInviteCode(): string {
  return `SQUAD-${randomSuffix(4)}-${randomSuffix(4)}`;
}

// =============================================================================
// Referral Code Functions
// =============================================================================

/**
 * Generates a memorable referral code like "IRON-FIT-7X" and inserts it
 * into the referral_codes table.
 */
export async function generateUniqueCode(userId: string): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = `${pickRandom(FIRST_WORDS)}-${pickRandom(SECOND_WORDS)}-${randomSuffix(2)}`;

    const { error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code, active: true });

    if (!error) {
      return code;
    }

    // If unique constraint violation, retry with a new code
    if (error.code === '23505') {
      continue;
    }

    throw new Error(`Failed to generate referral code: ${error.message}`);
  }

  throw new Error('Unable to generate a unique referral code after maximum attempts');
}

/**
 * Validates a referral code and returns the referrer's user ID if valid.
 */
export async function validateReferralCode(
  code: string,
): Promise<{ valid: boolean; referrerId?: string }> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('user_id')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to validate referral code: ${error.message}`);
  }

  if (!data) {
    return { valid: false };
  }

  return { valid: true, referrerId: data.user_id as string };
}

/**
 * Creates a referral entry linking a referrer to a new user.
 */
export async function applyReferralCode(
  code: string,
  newUserId: string,
): Promise<void> {
  const { valid, referrerId } = await validateReferralCode(code);

  if (!valid || !referrerId) {
    throw new Error('Invalid or inactive referral code');
  }

  const { error } = await supabase.from('referrals').insert({
    referrer_id: referrerId,
    referred_user_id: newUserId,
    code: code.toUpperCase().trim(),
    status: 'pending',
  });

  if (error) {
    throw new Error(`Failed to apply referral code: ${error.message}`);
  }
}

// =============================================================================
// Transformation Circle / Tier
// =============================================================================

/**
 * Calls the get_referral_tier() Supabase RPC function to calculate
 * the user's transformation circle tier.
 */
export async function calculateTransformationCircleTier(
  userId: string,
): Promise<TierInfo> {
  const { data, error } = await supabase.rpc('get_referral_tier', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to calculate tier: ${error.message}`);
  }

  const row = data as {
    tier: TierInfo['tier'];
    active_referrals: number;
    next_tier_threshold: number;
    discount_percent: number;
  };

  return {
    tier: row.tier,
    activeReferrals: row.active_referrals,
    nextTierThreshold: row.next_tier_threshold,
    discountPercent: row.discount_percent,
  };
}

// =============================================================================
// Rewards
// =============================================================================

/**
 * Issues a reward to the user: inserts a referral_rewards row, creates a
 * billing_ledger entry, and calls the Stripe reward Edge Function.
 */
export async function issueReward(
  userId: string,
  rewardType: string,
  source: string,
  params: RewardParams,
): Promise<void> {
  const { data: rewardRow, error: rewardError } = await supabase
    .from('referral_rewards')
    .insert({
      user_id: userId,
      reward_type: rewardType,
      source,
      months: params.months ?? null,
      discount_percent: params.discountPercent ?? null,
      badge: params.badge ?? null,
      description: params.description ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (rewardError || !rewardRow) {
    throw new Error(`Failed to create reward: ${rewardError?.message ?? 'No data returned'}`);
  }

  const { error: ledgerError } = await supabase.from('billing_ledger').insert({
    user_id: userId,
    entry_type: 'reward',
    reference_id: rewardRow.id as string,
    description: params.description ?? `${rewardType} reward from ${source}`,
    status: 'pending',
  });

  if (ledgerError) {
    throw new Error(`Failed to create billing ledger entry: ${ledgerError.message}`);
  }

  await applyRewardToStripe(userId, rewardRow.id as string);
}

/**
 * Calls the apply-reward Edge Function to sync the reward with Stripe.
 */
export async function applyRewardToStripe(
  userId: string,
  rewardId: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('apply-reward', {
    body: { user_id: userId, reward_id: rewardId },
  });

  if (error) {
    throw new Error(`Failed to apply reward to Stripe: ${error.message}`);
  }
}

// =============================================================================
// Squads
// =============================================================================

/**
 * Creates a new squad, adds the creator as the first member, and returns
 * the generated invite code.
 */
export async function createSquad(
  userId: string,
  name: string,
): Promise<string> {
  const inviteCode = generateInviteCode();

  const { data: squad, error: squadError } = await supabase
    .from('squads')
    .insert({
      name,
      invite_code: inviteCode,
      created_by: userId,
    })
    .select('id')
    .single();

  if (squadError || !squad) {
    throw new Error(`Failed to create squad: ${squadError?.message ?? 'No data returned'}`);
  }

  const { error: memberError } = await supabase.from('squad_members').insert({
    squad_id: (squad as SquadRow).id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) {
    throw new Error(`Failed to add creator to squad: ${memberError.message}`);
  }

  return inviteCode;
}

/**
 * Validates the invite code, adds the user to the squad, and recalculates
 * the squad's group discount.
 */
export async function joinSquad(
  userId: string,
  inviteCode: string,
): Promise<void> {
  const { data: squad, error: findError } = await supabase
    .from('squads')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to look up squad: ${findError.message}`);
  }

  if (!squad) {
    throw new Error('Invalid squad invite code');
  }

  const { error: joinError } = await supabase.from('squad_members').insert({
    squad_id: (squad as SquadRow).id,
    user_id: userId,
    role: 'member',
  });

  if (joinError) {
    throw new Error(`Failed to join squad: ${joinError.message}`);
  }

  await recalculateSquadDiscount((squad as SquadRow).id);
}

/**
 * Removes the user from their current squad and recalculates the squad discount.
 */
export async function leaveSquad(userId: string): Promise<void> {
  const { data: membership, error: lookupError } = await supabase
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to look up squad membership: ${lookupError.message}`);
  }

  if (!membership) {
    throw new Error('User is not in any squad');
  }

  const squadId = (membership as { squad_id: string }).squad_id;

  const { error: leaveError } = await supabase
    .from('squad_members')
    .delete()
    .eq('user_id', userId)
    .eq('squad_id', squadId);

  if (leaveError) {
    throw new Error(`Failed to leave squad: ${leaveError.message}`);
  }

  await recalculateSquadDiscount(squadId);
}

/**
 * Recalculates the squad discount based on member count.
 * 2 members = 5%, 3 = 10%, 4 = 15%, 5+ = 20% (capped).
 */
async function recalculateSquadDiscount(squadId: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('squad_members')
    .select('id', { count: 'exact', head: true })
    .eq('squad_id', squadId);

  if (countError) {
    throw new Error(`Failed to count squad members: ${countError.message}`);
  }

  const memberCount = count ?? 0;
  const discountPercent = Math.min(Math.max((memberCount - 1) * 5, 0), 20);

  const { error: updateError } = await supabase
    .from('squads')
    .update({ discount_percent: discountPercent })
    .eq('id', squadId);

  if (updateError) {
    throw new Error(`Failed to update squad discount: ${updateError.message}`);
  }
}

// =============================================================================
// Milestone Gifts
// =============================================================================

interface MilestoneRule {
  rewardType: string;
  months: number;
  badge: string | null;
}

const MILESTONE_RULES: Record<string, MilestoneRule> = {
  '30_day_streak': {
    rewardType: 'pro_subscription',
    months: 1,
    badge: null,
  },
  '90_day_streak': {
    rewardType: 'pro_subscription',
    months: 2,
    badge: null,
  },
  body_goal_hit: {
    rewardType: 'elite_subscription',
    months: 1,
    badge: null,
  },
  '365_day_streak': {
    rewardType: 'pro_subscription',
    months: 3,
    badge: 'Founding Transformer',
  },
};

/**
 * Checks if a milestone type qualifies for a gift. If eligible,
 * creates a milestone_gifts entry and returns it.
 */
export async function checkMilestoneEligibility(
  userId: string,
  milestoneType: string,
): Promise<MilestoneGift | null> {
  const rule = MILESTONE_RULES[milestoneType];
  if (!rule) {
    return null;
  }

  // Check if this milestone gift was already issued
  const { data: existing, error: checkError } = await supabase
    .from('milestone_gifts')
    .select('id')
    .eq('user_id', userId)
    .eq('milestone_type', milestoneType)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check milestone eligibility: ${checkError.message}`);
  }

  if (existing) {
    return null; // Already issued
  }

  const giftCode = generateGiftCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days to claim

  const { data: gift, error: insertError } = await supabase
    .from('milestone_gifts')
    .insert({
      user_id: userId,
      milestone_type: milestoneType,
      reward_type: rule.rewardType,
      reward_months: rule.months,
      badge: rule.badge,
      gift_code: giftCode,
      status: 'available',
      recipient_email: null,
      recipient_id: null,
      expires_at: expiresAt.toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !gift) {
    throw new Error(
      `Failed to create milestone gift: ${insertError?.message ?? 'No data returned'}`,
    );
  }

  return mapGiftRow(gift);
}

/**
 * Marks a gift as 'sent' and returns a shareable link.
 */
export async function sendGift(
  giftId: string,
  recipientEmail: string,
): Promise<string> {
  const { data: gift, error } = await supabase
    .from('milestone_gifts')
    .update({
      status: 'sent',
      recipient_email: recipientEmail,
    })
    .eq('id', giftId)
    .eq('status', 'available')
    .select('gift_code')
    .single();

  if (error || !gift) {
    throw new Error(`Failed to send gift: ${error?.message ?? 'Gift not found or already sent'}`);
  }

  return `https://transformr.app/gift/${(gift as { gift_code: string }).gift_code}`;
}

/**
 * Validates a gift code, checks expiration, sets the recipient,
 * marks as 'claimed', and issues the reward.
 */
export async function claimGift(
  giftCode: string,
  userId: string,
): Promise<void> {
  const { data: gift, error: lookupError } = await supabase
    .from('milestone_gifts')
    .select('*')
    .eq('gift_code', giftCode.toUpperCase().trim())
    .eq('status', 'sent')
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to look up gift: ${lookupError.message}`);
  }

  if (!gift) {
    throw new Error('Invalid or already claimed gift code');
  }

  const giftRow = gift as {
    id: string;
    expires_at: string;
    reward_type: string;
    reward_months: number;
    badge: string | null;
    user_id: string;
  };

  if (new Date(giftRow.expires_at) < new Date()) {
    await supabase
      .from('milestone_gifts')
      .update({ status: 'expired' })
      .eq('id', giftRow.id);
    throw new Error('This gift has expired');
  }

  const { error: claimError } = await supabase
    .from('milestone_gifts')
    .update({
      recipient_id: userId,
      status: 'claimed',
    })
    .eq('id', giftRow.id);

  if (claimError) {
    throw new Error(`Failed to claim gift: ${claimError.message}`);
  }

  await issueReward(userId, giftRow.reward_type, 'milestone_gift', {
    months: giftRow.reward_months,
    badge: giftRow.badge ?? undefined,
    description: `Gift from milestone (${giftRow.reward_type})`,
  });
}

// =============================================================================
// Share Tracking
// =============================================================================

/**
 * Creates a share_events entry to track when a user shares content.
 */
export async function trackShare(
  userId: string,
  shareType: string,
  platform: string,
): Promise<void> {
  const { error } = await supabase.from('share_events').insert({
    user_id: userId,
    share_type: shareType,
    platform,
  });

  if (error) {
    throw new Error(`Failed to track share: ${error.message}`);
  }
}

// =============================================================================
// Creator Profile
// =============================================================================

/**
 * Gets the creator profile for a user including referral stats and tier.
 */
export async function getCreatorProfile(
  userId: string,
): Promise<CreatorProfile | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  if (!profile) {
    return null;
  }

  const profileRow = profile as { display_name: string; created_at: string };

  const { count: activeReferrals, error: refError } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .eq('status', 'active');

  if (refError) {
    throw new Error(`Failed to count referrals: ${refError.message}`);
  }

  const referralCount = activeReferrals ?? 0;

  const { data: earningsData, error: earningsError } = await supabase
    .from('referral_rewards')
    .select('months')
    .eq('user_id', userId)
    .eq('status', 'applied');

  if (earningsError) {
    throw new Error(`Failed to fetch earnings: ${earningsError.message}`);
  }

  const totalEarnings = (earningsData as { months: number | null }[]).reduce(
    (sum, row) => sum + (row.months ?? 0),
    0,
  );

  const tierInfo = await calculateTransformationCircleTier(userId);

  return {
    userId,
    displayName: profileRow.display_name,
    activeReferrals: referralCount,
    totalEarnings,
    tier: tierInfo.tier,
    isEligible: referralCount >= 10,
    joinedAt: profileRow.created_at,
  };
}

/**
 * Returns true if the user has 10+ active referrals.
 */
export async function checkCreatorEligibility(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to check creator eligibility: ${error.message}`);
  }

  return (count ?? 0) >= 10;
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Gets all referrals for a user (as the referrer).
 */
export async function getReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('id, referrer_id, referred_user_id, code, status, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch referrals: ${error.message}`);
  }

  return (data as {
    id: string;
    referrer_id: string;
    referred_user_id: string;
    code: string;
    status: Referral['status'];
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    referrerId: row.referrer_id,
    referredUserId: row.referred_user_id,
    code: row.code,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/**
 * Gets all rewards for a user.
 */
export async function getRewards(userId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('id, user_id, reward_type, source, months, discount_percent, badge, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch rewards: ${error.message}`);
  }

  return (data as {
    id: string;
    user_id: string;
    reward_type: string;
    source: string;
    months: number | null;
    discount_percent: number | null;
    badge: string | null;
    status: Reward['status'];
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    rewardType: row.reward_type,
    source: row.source,
    months: row.months,
    discountPercent: row.discount_percent,
    badge: row.badge,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/**
 * Gets all milestone gifts for a user (as the gift giver).
 */
export async function getGifts(userId: string): Promise<MilestoneGift[]> {
  const { data, error } = await supabase
    .from('milestone_gifts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch gifts: ${error.message}`);
  }

  return (data as Record<string, unknown>[]).map(mapGiftRow);
}

// =============================================================================
// Internal Mappers
// =============================================================================

function mapGiftRow(row: Record<string, unknown>): MilestoneGift {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    milestoneType: row.milestone_type as string,
    rewardType: row.reward_type as string,
    rewardMonths: row.reward_months as number,
    badge: (row.badge as string) ?? null,
    giftCode: row.gift_code as string,
    status: row.status as MilestoneGift['status'],
    recipientEmail: (row.recipient_email as string) ?? null,
    recipientId: (row.recipient_id as string) ?? null,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  };
}
