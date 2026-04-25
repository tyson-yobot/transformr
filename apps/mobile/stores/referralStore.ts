// =============================================================================
// TRANSFORMR — Referral & Rewards Store
// =============================================================================

import { create } from 'zustand';
import {
  generateUniqueCode,
  validateReferralCode,
  applyReferralCode,
  calculateTransformationCircleTier,
  issueReward,
  createSquad,
  joinSquad,
  leaveSquad,
  checkMilestoneEligibility,
  sendGift,
  claimGift,
  trackShare,
  getCreatorProfile,
  checkCreatorEligibility,
  getReferrals,
  getRewards,
  getGifts,
} from '../services/referralService';
import type {
  TierInfo,
  RewardParams,
  MilestoneGift,
  CreatorProfile,
  Referral,
  Reward,
} from '../services/referralService';
import {
  getActiveDiscounts,
  getBillingHistory,
} from '../services/stripeBillingService';
import type {
  ActiveDiscount,
  BillingLedgerEntry,
} from '../services/stripeBillingService';

// =============================================================================
// State Types
// =============================================================================

interface ReferralState {
  // Referral code
  myCode: string | null;
  codeLoading: boolean;
  codeError: string | null;

  // Referral list
  referrals: Referral[];
  referralsLoading: boolean;
  referralsError: string | null;

  // Tier info
  tierInfo: TierInfo | null;
  tierLoading: boolean;

  // Rewards
  rewards: Reward[];
  rewardsLoading: boolean;
  rewardsError: string | null;

  // Gifts
  gifts: MilestoneGift[];
  giftsLoading: boolean;
  giftsError: string | null;

  // Squad
  squadId: string | null;
  squadInviteCode: string | null;
  squadLoading: boolean;
  squadError: string | null;

  // Active discounts
  activeDiscounts: ActiveDiscount[];
  discountsLoading: boolean;

  // Billing history
  billingHistory: BillingLedgerEntry[];
  billingLoading: boolean;

  // Creator
  creatorProfile: CreatorProfile | null;
  isCreatorEligible: boolean;
  creatorLoading: boolean;

  // Code validation
  validationResult: { valid: boolean; referrerId?: string } | null;
  validationLoading: boolean;
}

interface ReferralActions {
  // Code management
  generateCode: (userId: string) => Promise<void>;
  validateCode: (code: string) => Promise<{ valid: boolean; referrerId?: string }>;
  applyCode: (code: string, userId: string) => Promise<void>;

  // Data loading
  loadReferrals: (userId: string) => Promise<void>;
  loadTier: (userId: string) => Promise<void>;
  loadRewards: (userId: string) => Promise<void>;
  loadGifts: (userId: string) => Promise<void>;
  loadActiveDiscounts: (userId: string) => Promise<void>;
  loadBillingHistory: (userId: string) => Promise<void>;
  loadCreatorProfile: (userId: string) => Promise<void>;
  loadAll: (userId: string) => Promise<void>;

  // Reward actions
  issueNewReward: (userId: string, rewardType: string, source: string, params: RewardParams) => Promise<void>;

  // Squad actions
  createNewSquad: (userId: string, name: string) => Promise<void>;
  joinExistingSquad: (userId: string, inviteCode: string) => Promise<void>;
  leaveCurrentSquad: (userId: string) => Promise<void>;

  // Gift actions
  checkMilestone: (userId: string, milestoneType: string) => Promise<MilestoneGift | null>;
  sendMilestoneGift: (giftId: string, recipientEmail: string) => Promise<string>;
  claimMilestoneGift: (giftCode: string, userId: string) => Promise<void>;

  // Share tracking
  logShare: (userId: string, shareType: string, platform: string) => Promise<void>;

  // Reset
  reset: () => void;
}

type ReferralStore = ReferralState & ReferralActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: ReferralState = {
  myCode: null,
  codeLoading: false,
  codeError: null,
  referrals: [],
  referralsLoading: false,
  referralsError: null,
  tierInfo: null,
  tierLoading: false,
  rewards: [],
  rewardsLoading: false,
  rewardsError: null,
  gifts: [],
  giftsLoading: false,
  giftsError: null,
  squadId: null,
  squadInviteCode: null,
  squadLoading: false,
  squadError: null,
  activeDiscounts: [],
  discountsLoading: false,
  billingHistory: [],
  billingLoading: false,
  creatorProfile: null,
  isCreatorEligible: false,
  creatorLoading: false,
  validationResult: null,
  validationLoading: false,
};

// =============================================================================
// Store
// =============================================================================

export const useReferralStore = create<ReferralStore>()((set, get) => ({
  ...initialState,

  // ─── Code Management ──────────────────────────────────────────────────────

  generateCode: async (userId: string) => {
    set({ codeLoading: true, codeError: null });
    try {
      const code = await generateUniqueCode(userId);
      set({ myCode: code, codeLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate code';
      set({ codeError: message, codeLoading: false });
    }
  },

  validateCode: async (code: string) => {
    set({ validationLoading: true, validationResult: null });
    try {
      const result = await validateReferralCode(code);
      set({ validationResult: result, validationLoading: false });
      return result;
    } catch (err) {
      set({ validationLoading: false });
      return { valid: false };
    }
  },

  applyCode: async (code: string, userId: string) => {
    set({ codeLoading: true, codeError: null });
    try {
      await applyReferralCode(code, userId);
      set({ codeLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply code';
      set({ codeError: message, codeLoading: false });
    }
  },

  // ─── Data Loading ─────────────────────────────────────────────────────────

  loadReferrals: async (userId: string) => {
    set({ referralsLoading: true, referralsError: null });
    try {
      const data = await getReferrals(userId);
      set({ referrals: data, referralsLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load referrals';
      set({ referralsError: message, referralsLoading: false });
    }
  },

  loadTier: async (userId: string) => {
    set({ tierLoading: true });
    try {
      const info = await calculateTransformationCircleTier(userId);
      set({ tierInfo: info, tierLoading: false });
    } catch {
      set({ tierLoading: false });
    }
  },

  loadRewards: async (userId: string) => {
    set({ rewardsLoading: true, rewardsError: null });
    try {
      const data = await getRewards(userId);
      set({ rewards: data, rewardsLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rewards';
      set({ rewardsError: message, rewardsLoading: false });
    }
  },

  loadGifts: async (userId: string) => {
    set({ giftsLoading: true, giftsError: null });
    try {
      const data = await getGifts(userId);
      set({ gifts: data, giftsLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load gifts';
      set({ giftsError: message, giftsLoading: false });
    }
  },

  loadActiveDiscounts: async (userId: string) => {
    set({ discountsLoading: true });
    try {
      const data = await getActiveDiscounts(userId);
      set({ activeDiscounts: data, discountsLoading: false });
    } catch {
      set({ discountsLoading: false });
    }
  },

  loadBillingHistory: async (userId: string) => {
    set({ billingLoading: true });
    try {
      const data = await getBillingHistory(userId);
      set({ billingHistory: data, billingLoading: false });
    } catch {
      set({ billingLoading: false });
    }
  },

  loadCreatorProfile: async (userId: string) => {
    set({ creatorLoading: true });
    try {
      const [profile, eligible] = await Promise.all([
        getCreatorProfile(userId),
        checkCreatorEligibility(userId),
      ]);
      set({
        creatorProfile: profile,
        isCreatorEligible: eligible,
        creatorLoading: false,
      });
    } catch {
      set({ creatorLoading: false });
    }
  },

  loadAll: async (userId: string) => {
    const store = get();
    await Promise.all([
      store.loadReferrals(userId),
      store.loadTier(userId),
      store.loadRewards(userId),
      store.loadGifts(userId),
      store.loadActiveDiscounts(userId),
      store.loadCreatorProfile(userId),
    ]);
  },

  // ─── Reward Actions ───────────────────────────────────────────────────────

  issueNewReward: async (userId: string, rewardType: string, source: string, params: RewardParams) => {
    try {
      await issueReward(userId, rewardType, source, params);
      // Refresh rewards after issuing
      await get().loadRewards(userId);
    } catch {
      // Error handled in service layer
    }
  },

  // ─── Squad Actions ────────────────────────────────────────────────────────

  createNewSquad: async (userId: string, name: string) => {
    set({ squadLoading: true, squadError: null });
    try {
      const inviteCode = await createSquad(userId, name);
      set({ squadInviteCode: inviteCode, squadLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create squad';
      set({ squadError: message, squadLoading: false });
    }
  },

  joinExistingSquad: async (userId: string, inviteCode: string) => {
    set({ squadLoading: true, squadError: null });
    try {
      await joinSquad(userId, inviteCode);
      set({ squadLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join squad';
      set({ squadError: message, squadLoading: false });
    }
  },

  leaveCurrentSquad: async (userId: string) => {
    set({ squadLoading: true, squadError: null });
    try {
      await leaveSquad(userId);
      set({ squadId: null, squadInviteCode: null, squadLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave squad';
      set({ squadError: message, squadLoading: false });
    }
  },

  // ─── Gift Actions ─────────────────────────────────────────────────────────

  checkMilestone: async (userId: string, milestoneType: string) => {
    try {
      const gift = await checkMilestoneEligibility(userId, milestoneType);
      if (gift) {
        await get().loadGifts(userId);
      }
      return gift;
    } catch {
      return null;
    }
  },

  sendMilestoneGift: async (giftId: string, recipientEmail: string) => {
    const link = await sendGift(giftId, recipientEmail);
    return link;
  },

  claimMilestoneGift: async (giftCode: string, userId: string) => {
    await claimGift(giftCode, userId);
    await get().loadRewards(userId);
  },

  // ─── Share Tracking ───────────────────────────────────────────────────────

  logShare: async (userId: string, shareType: string, platform: string) => {
    try {
      await trackShare(userId, shareType, platform);
    } catch {
      // Non-critical — don't block UX for share tracking failures
    }
  },

  // ─── Reset ────────────────────────────────────────────────────────────────

  reset: () => {
    set(initialState);
  },
}));

// =============================================================================
// Narrowed Selectors
// =============================================================================

export const useReferralCode = () => useReferralStore((s) => s.myCode);
export const useReferralCodeLoading = () => useReferralStore((s) => s.codeLoading);
export const useReferralsList = () => useReferralStore((s) => s.referrals);
export const useReferralsLoading = () => useReferralStore((s) => s.referralsLoading);
export const useTierInfo = () => useReferralStore((s) => s.tierInfo);
export const useTierLoading = () => useReferralStore((s) => s.tierLoading);
export const useRewardsList = () => useReferralStore((s) => s.rewards);
export const useRewardsLoading = () => useReferralStore((s) => s.rewardsLoading);
export const useGiftsList = () => useReferralStore((s) => s.gifts);
export const useGiftsLoading = () => useReferralStore((s) => s.giftsLoading);
export const useSquadLoading = () => useReferralStore((s) => s.squadLoading);
export const useSquadError = () => useReferralStore((s) => s.squadError);
export const useSquadInviteCode = () => useReferralStore((s) => s.squadInviteCode);
export const useActiveDiscounts = () => useReferralStore((s) => s.activeDiscounts);
export const useCreatorProfile = () => useReferralStore((s) => s.creatorProfile);
export const useIsCreatorEligible = () => useReferralStore((s) => s.isCreatorEligible);
export const useValidationResult = () => useReferralStore((s) => s.validationResult);
export const useValidationLoading = () => useReferralStore((s) => s.validationLoading);
