// =============================================================================
// TRANSFORMR — Offline Sync Store
//
// Lightweight reactive layer over the MMKV sync queue. Provides observable
// state for UI components (pending count, sync status, online state).
// The actual sync work is performed by the `useOfflineSync` hook — this store
// only exposes state derived from the MMKV queue for display purposes.
//
// No persist middleware needed: state is always derived from MMKV.
// =============================================================================

import { create } from 'zustand';
import { getSyncQueue } from '../utils/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
}

interface OfflineSyncActions {
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  syncStarted: () => void;
  syncCompleted: () => void;
  refreshPendingCount: () => void;
}

type OfflineSyncStore = OfflineSyncState & OfflineSyncActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: OfflineSyncState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useOfflineSyncStore = create<OfflineSyncStore>()((set, get) => ({
  ...initialState,

  /**
   * Update online status. When coming back online, immediately refresh the
   * pending count from MMKV so the UI reflects the current queue size.
   */
  setOnline: (online: boolean) => {
    if (online) {
      const queue = getSyncQueue();
      set({ isOnline: true, pendingCount: queue.length });
    } else {
      set({ isOnline: false });
    }
  },

  /**
   * Directly set the pending count (for optimistic updates by the sync hook).
   */
  setPendingCount: (count: number) => {
    set({ pendingCount: count });
  },

  /**
   * Called by `useOfflineSync` when a sync pass begins.
   */
  syncStarted: () => {
    set({ isSyncing: true });
  },

  /**
   * Called by `useOfflineSync` when a sync pass finishes (success or partial).
   * Refreshes pending count from MMKV and records the sync timestamp.
   */
  syncCompleted: () => {
    const queue = getSyncQueue();
    set({
      isSyncing: false,
      lastSyncAt: Date.now(),
      pendingCount: queue.length,
    });
  },

  /**
   * Read the current queue length from MMKV and update the store.
   * Can be called from any component that needs a fresh count.
   */
  refreshPendingCount: () => {
    const queue = getSyncQueue();
    // Avoid a redundant re-render if the count hasn't changed.
    if (get().pendingCount !== queue.length) {
      set({ pendingCount: queue.length });
    }
  },
}));
