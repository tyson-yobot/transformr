// =============================================================================
// TRANSFORMR -- Supplements Store (Budget-Aware + Evidence)
// =============================================================================

import { create } from 'zustand';
import { addToSyncQueue } from '@utils/storage';
import {
  createUserSupplement,
  deleteUserSupplement,
  fetchTodayLogs,
  fetchUserSupplements,
  getSupplementBudget,
  getSupplementRecommendations,
  logSupplementTaken,
  updateSupplementBudget,
  updateUserSupplement,
} from '@services/ai/supplement';
import type {
  InteractionWarning,
  SupplementAdvisorResponse,
  SupplementCategory,
  SupplementEvidenceLevel,
  SupplementRecommendation,
  SupplementTier,
  SupplementTiming,
  EvidenceSource,
  UserSupplement,
  UserSupplementLog,
} from '@app-types/ai';

interface SupplementsState {
  supplements: UserSupplement[];
  todayLogs: UserSupplementLog[];
  budget: number;
  aiRecommendations: SupplementRecommendation[];
  interactionWarnings: InteractionWarning[];
  dailySchedule: Record<string, string[]>;
  totalEstimatedCost: number;
  budgetFit: boolean;
  budgetNotes: string;
  isLoadingSupplements: boolean;
  isLoadingRecommendations: boolean;
  error: string | null;
}

interface SupplementsActions {
  fetchAll: () => Promise<void>;
  fetchRecommendations: (focus?: string) => Promise<void>;
  addSupplement: (args: {
    name: string;
    dosage?: string;
    timing?: SupplementTiming;
    frequency?: string;
    category?: SupplementCategory;
    tier?: SupplementTier;
    priority?: number;
    evidenceLevel?: SupplementEvidenceLevel;
    evidenceSources?: EvidenceSource[];
    monthlyCost?: number;
    isAiRecommended?: boolean;
    aiRecommendationReason?: string;
    notes?: string;
  }) => Promise<void>;
  addFromRecommendation: (rec: SupplementRecommendation) => Promise<void>;
  updateSupplement: (
    id: string,
    updates: Partial<UserSupplement>,
  ) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  removeSupplement: (id: string) => Promise<void>;
  logTaken: (supplementId: string) => Promise<void>;
  setBudget: (amount: number) => Promise<void>;
  clearError: () => void;
}

type SupplementsStore = SupplementsState & SupplementsActions;

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

export const useSupplementsStore = create<SupplementsStore>()((set, get) => ({
  supplements: [],
  todayLogs: [],
  budget: 0,
  aiRecommendations: [],
  interactionWarnings: [],
  dailySchedule: {},
  totalEstimatedCost: 0,
  budgetFit: true,
  budgetNotes: '',
  isLoadingSupplements: false,
  isLoadingRecommendations: false,
  error: null,

  fetchAll: async () => {
    set({ isLoadingSupplements: true, error: null });
    try {
      const [supplements, todayLogs, budget] = await Promise.all([
        fetchUserSupplements(false),
        fetchTodayLogs(),
        getSupplementBudget(),
      ]);
      set({ supplements, todayLogs, budget, isLoadingSupplements: false });
    } catch (err) {
      set({ isLoadingSupplements: false, error: toErrorMessage(err) });
    }
  },

  fetchRecommendations: async (focus) => {
    set({ isLoadingRecommendations: true, error: null });
    try {
      const response: SupplementAdvisorResponse =
        await getSupplementRecommendations({
          budgetMonthly: get().budget || undefined,
          focus,
        });
      set({
        aiRecommendations: response.recommendations,
        interactionWarnings: response.interactions_warnings,
        dailySchedule: response.daily_schedule,
        totalEstimatedCost: response.total_estimated_monthly_cost,
        budgetFit: response.budget_fit,
        budgetNotes: response.budget_notes,
        isLoadingRecommendations: false,
      });
    } catch (err) {
      set({ isLoadingRecommendations: false, error: toErrorMessage(err) });
    }
  },

  addSupplement: async (args) => {
    try {
      const created = await createUserSupplement(args);
      set((s) => ({
        supplements: [...s.supplements, created].sort(
          (a, b) => a.priority - b.priority,
        ),
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
      throw err;
    }
  },

  addFromRecommendation: async (rec) => {
    try {
      const created = await createUserSupplement({
        name: rec.name,
        dosage: rec.dosage,
        timing: rec.timing,
        frequency: rec.frequency,
        category: rec.category,
        tier: rec.tier,
        priority: rec.priority,
        evidenceLevel: rec.evidence_level,
        evidenceSources: rec.evidence_sources,
        monthlyCost: rec.monthly_cost,
        isAiRecommended: true,
        aiRecommendationReason: rec.reason,
      });
      set((s) => ({
        supplements: [...s.supplements, created].sort(
          (a, b) => a.priority - b.priority,
        ),
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
      throw err;
    }
  },

  updateSupplement: async (id, updates) => {
    try {
      const updated = await updateUserSupplement(id, updates);
      set((s) => ({
        supplements: s.supplements
          .map((su) => (su.id === id ? updated : su))
          .sort((a, b) => a.priority - b.priority),
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
      throw err;
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const updated = await updateUserSupplement(id, { is_active: isActive });
      set((s) => ({
        supplements: s.supplements.map((su) =>
          su.id === id ? updated : su,
        ),
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
    }
  },

  removeSupplement: async (id) => {
    try {
      await deleteUserSupplement(id);
      set((s) => ({
        supplements: s.supplements.filter((su) => su.id !== id),
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
      throw err;
    }
  },

  logTaken: async (supplementId) => {
    try {
      const log = await logSupplementTaken(supplementId);
      addToSyncQueue({ table: 'user_supplement_logs', operation: 'insert', data: { supplement_id: supplementId } });
      set((s) => ({
        todayLogs: [log, ...s.todayLogs],
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
    }
  },

  setBudget: async (amount) => {
    try {
      await updateSupplementBudget(amount);
      set({ budget: amount });
    } catch (err) {
      set({ error: toErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
