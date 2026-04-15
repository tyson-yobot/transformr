// =============================================================================
// TRANSFORMR — Partner Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Partnership, Profile, PartnerNudge } from '../types/database';

type NudgeType = NonNullable<PartnerNudge['type']>;

interface PartnerState {
  partnership: Partnership | null;
  partnerProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

interface PartnerActions {
  fetchPartnership: () => Promise<void>;
  createPartnershipInvite: () => Promise<string | null>;
  sendNudge: (type: NudgeType, message: string) => Promise<void>;
  linkPartner: (inviteCode: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type PartnerStore = PartnerState & PartnerActions;

export const usePartnerStore = create<PartnerStore>()((set, get) => ({
  // --- State ---
  partnership: null,
  partnerProfile: null,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchPartnership: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: partnership, error } = await supabase
        .from('partnerships')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;

      if (!partnership) {
        set({ partnership: null, partnerProfile: null, isLoading: false });
        return;
      }

      const typedPartnership = partnership as Partnership;
      const partnerId =
        typedPartnership.user_a === user.id
          ? typedPartnership.user_b
          : typedPartnership.user_a;

      if (!partnerId) {
        set({ partnership: typedPartnership, partnerProfile: null, isLoading: false });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();
      if (profileError) throw profileError;

      set({
        partnership: typedPartnership,
        partnerProfile: profile as Profile,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch partnership';
      set({ error: message, isLoading: false });
    }
  },

  createPartnershipInvite: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Generate a stable, unique invite code
      const code = `TFR-${Math.random().toString(36).substring(2, 5).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const { data, error } = await supabase
        .from('partnerships')
        .insert({
          user_a: user.id,
          status: 'pending',
          invite_code: code,
        })
        .select()
        .single();
      if (error) throw error;

      set({ partnership: data as Partnership });
      return code;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      set({ error: message });
      return null;
    }
  },

  sendNudge: async (type, message) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const partnership = get().partnership;
      if (!partnership) throw new Error('No active partnership');

      const receiverId =
        partnership.user_a === user.id
          ? partnership.user_b
          : partnership.user_a;

      const { error } = await supabase.from('partner_nudges').insert({
        from_user_id: user.id,
        to_user_id: receiverId,
        type,
        message,
        is_read: false,
      });
      if (error) throw error;

      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send nudge';
      set({ error: msg, isLoading: false });
    }
  },

  linkPartner: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find the pending partnership by invite code
      const { data: partnership, error: findError } = await supabase
        .from('partnerships')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single();
      if (findError) throw findError;
      if (!partnership) throw new Error('Invalid invite code');

      const typedPartnership = partnership as Partnership;

      // Activate the partnership by setting user_b
      const { data: updated, error: updateError } = await supabase
        .from('partnerships')
        .update({
          user_b: user.id,
          status: 'active',
        })
        .eq('id', typedPartnership.id)
        .select()
        .single();
      if (updateError) throw updateError;

      // Fetch partner profile (the original creator)
      const partnerId = (updated as Partnership).user_a;
      if (!partnerId) {
        set({ partnership: updated as Partnership, partnerProfile: null, isLoading: false });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();
      if (profileError) throw profileError;

      set({
        partnership: updated as Partnership,
        partnerProfile: profile as Profile,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to link partner';
      set({ error: msg, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      partnership: null,
      partnerProfile: null,
      isLoading: false,
      error: null,
    }),
}));
