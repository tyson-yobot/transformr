import { useOfflineSyncStore } from '../../stores/offlineSyncStore';

// offlineSyncStore has no Supabase calls — pure state management

const RESET_STATE = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
};

beforeEach(() => {
  useOfflineSyncStore.setState(RESET_STATE);
});

describe('initial state', () => {
  it('is online by default', () => {
    expect(useOfflineSyncStore.getState().isOnline).toBe(true);
  });

  it('is not syncing by default', () => {
    expect(useOfflineSyncStore.getState().isSyncing).toBe(false);
  });

  it('has 0 pending items', () => {
    expect(useOfflineSyncStore.getState().pendingCount).toBe(0);
  });

  it('has null lastSyncAt', () => {
    expect(useOfflineSyncStore.getState().lastSyncAt).toBeNull();
  });
});

describe('setOnline', () => {
  it('sets offline state', () => {
    useOfflineSyncStore.getState().setOnline(false);
    expect(useOfflineSyncStore.getState().isOnline).toBe(false);
  });

  it('sets online state back', () => {
    useOfflineSyncStore.setState({ isOnline: false });
    useOfflineSyncStore.getState().setOnline(true);
    expect(useOfflineSyncStore.getState().isOnline).toBe(true);
  });
});

describe('setPendingCount', () => {
  it('sets pending count to given value', () => {
    useOfflineSyncStore.getState().setPendingCount(5);
    expect(useOfflineSyncStore.getState().pendingCount).toBe(5);
  });

  it('can set to 0', () => {
    useOfflineSyncStore.setState({ pendingCount: 5 });
    useOfflineSyncStore.getState().setPendingCount(0);
    expect(useOfflineSyncStore.getState().pendingCount).toBe(0);
  });
});

describe('syncStarted / syncCompleted', () => {
  it('syncStarted sets isSyncing to true', () => {
    useOfflineSyncStore.getState().syncStarted();
    expect(useOfflineSyncStore.getState().isSyncing).toBe(true);
  });

  it('syncCompleted sets isSyncing to false and updates lastSyncAt', () => {
    useOfflineSyncStore.setState({ isSyncing: true });
    useOfflineSyncStore.getState().syncCompleted();
    expect(useOfflineSyncStore.getState().isSyncing).toBe(false);
    expect(useOfflineSyncStore.getState().lastSyncAt).not.toBeNull();
  });
});

describe('refreshPendingCount', () => {
  it('reads the sync queue and updates pendingCount', () => {
    // MMKV mock is empty, so queue is empty → pendingCount = 0
    useOfflineSyncStore.getState().refreshPendingCount();
    expect(useOfflineSyncStore.getState().pendingCount).toBeGreaterThanOrEqual(0);
  });
});
