// =============================================================================
// TRANSFORMR — Share Service
//
// Native sharing via expo-sharing, clipboard via expo-clipboard, and
// share-event logging to Supabase. Used by referral, gifting, squad,
// and social features throughout the app.
// =============================================================================

import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabase';

// =============================================================================
// Types
// =============================================================================

interface ShareEventRow {
  share_type: string;
  platform: string;
  link: string;
  metadata: Record<string, string | number>;
}

interface AchievementPayload {
  name: string;
  description: string;
}

interface WorkoutSummaryPayload {
  exerciseCount: number;
  totalSets: number;
  duration: number;
  prs: number;
}

// =============================================================================
// Constants
// =============================================================================

const BASE_URL = 'https://transformrpro.com';

// =============================================================================
// Internal Helpers
// =============================================================================

function buildReferralLink(code: string): string {
  return `${BASE_URL}/r/${code}`;
}

function buildGiftLink(giftCode: string): string {
  return `${BASE_URL}/gift/${giftCode}`;
}

function buildSquadLink(inviteCode: string): string {
  return `${BASE_URL}/squad/${inviteCode}`;
}

async function openShareSheet(message: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(message, {
    dialogTitle: 'Share via TRANSFORMR',
    UTI: 'public.plain-text',
    mimeType: 'text/plain',
  });
}

async function logShareEvent(event: ShareEventRow): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('share_events').insert({
    user_id: user.id,
    share_type: event.share_type,
    platform: event.platform,
    link: event.link,
    metadata: event.metadata,
    created_at: new Date().toISOString(),
  });
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Share a referral link via the native share sheet.
 * Composes a motivational message and logs the share event.
 */
export async function shareReferralLink(
  code: string,
  platform: string,
): Promise<void> {
  const link = buildReferralLink(code);
  const message =
    `Ready to transform everything? Join me on TRANSFORMR ` +
    `and let's crush our goals together.\n\n${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'referral',
    platform,
    link,
    metadata: { code },
  });
}

/**
 * Share a gift link tied to a milestone achievement.
 */
export async function shareGiftLink(
  giftCode: string,
  milestone: string,
  platform: string,
): Promise<void> {
  const link = buildGiftLink(giftCode);
  const message =
    `I just unlocked "${milestone}" on TRANSFORMR and earned a gift ` +
    `for someone special. Claim yours here:\n\n${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'gift',
    platform,
    link,
    metadata: { giftCode, milestone },
  });
}

/**
 * Share a squad invite link.
 */
export async function shareSquadInvite(
  inviteCode: string,
  squadName: string,
  platform: string,
): Promise<void> {
  const link = buildSquadLink(inviteCode);
  const message =
    `Join my squad "${squadName}" on TRANSFORMR! ` +
    `Let's hold each other accountable and level up together.\n\n${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'squad_invite',
    platform,
    link,
    metadata: { inviteCode, squadName },
  });
}

/**
 * Share an achievement along with a referral link.
 */
export async function shareAchievement(
  achievement: AchievementPayload,
  referralCode: string,
  platform: string,
): Promise<void> {
  const link = buildReferralLink(referralCode);
  const message =
    `Achievement unlocked on TRANSFORMR!\n\n` +
    `${achievement.name}\n` +
    `${achievement.description}\n\n` +
    `Start your own transformation journey: ${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'achievement',
    platform,
    link,
    metadata: { achievement: achievement.name, referralCode },
  });
}

/**
 * Share a workout summary with stats and a referral link.
 */
export async function shareWorkoutSummary(
  summary: WorkoutSummaryPayload,
  referralCode: string,
  platform: string,
): Promise<void> {
  const link = buildReferralLink(referralCode);
  const durationMin = Math.round(summary.duration / 60);
  const prLine = summary.prs > 0 ? ` and hit ${summary.prs} new PR${summary.prs > 1 ? 's' : ''}` : '';

  const message =
    `Just crushed a workout on TRANSFORMR!\n\n` +
    `${summary.exerciseCount} exercises | ${summary.totalSets} sets | ${durationMin} min${prLine}\n\n` +
    `Train with me: ${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'workout_summary',
    platform,
    link,
    metadata: {
      exerciseCount: summary.exerciseCount,
      totalSets: summary.totalSets,
      duration: summary.duration,
      prs: summary.prs,
      referralCode,
    },
  });
}

/**
 * Share a streak milestone with a referral link.
 */
export async function shareStreak(
  streakDays: number,
  referralCode: string,
  platform: string,
): Promise<void> {
  const link = buildReferralLink(referralCode);
  const message =
    `I just hit a ${streakDays}-day streak on TRANSFORMR! ` +
    `Consistency is the ultimate superpower.\n\n` +
    `Start building yours: ${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'streak',
    platform,
    link,
    metadata: { streakDays, referralCode },
  });
}

/**
 * Share a personal record with stats and a referral link.
 */
export async function sharePR(
  exercise: string,
  weight: number,
  reps: number,
  referralCode: string,
  platform: string,
): Promise<void> {
  const link = buildReferralLink(referralCode);
  const message =
    `NEW PR on TRANSFORMR!\n\n` +
    `${exercise}: ${weight} lbs x ${reps} rep${reps > 1 ? 's' : ''}\n\n` +
    `Every rep counts. Join me: ${link}`;

  await openShareSheet(message);

  await logShareEvent({
    share_type: 'pr',
    platform,
    link,
    metadata: { exercise, weight, reps, referralCode },
  });
}

/**
 * Copy text to the device clipboard using expo-clipboard.
 */
export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

/**
 * Generate a URL that resolves to a QR code image for the given link.
 * Uses the goqr.me public API to render a 200x200 PNG.
 */
export function generateQRCodeDataUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}
