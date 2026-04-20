import { renderHook, act } from '@testing-library/react-native';

const mockNetInfoUnsubscribe = jest.fn();
const mockAddEventListener = jest.fn().mockReturnValue(mockNetInfoUnsubscribe);

jest.mock('@react-native-community/netinfo', () => {
  const mock = { addEventListener: (...args: unknown[]) => mockAddEventListener(...args) };
  return { __esModule: true, default: mock };
});

const mockGetSyncQueue = jest.fn().mockReturnValue([]);
const mockRemoveSyncQueueItem = jest.fn();

jest.mock('../../utils/storage', () => ({
  getSyncQueue: (...args: unknown[]) => mockGetSyncQueue(...args),
  removeSyncQueueItem: (...args: unknown[]) => mockRemoveSyncQueueItem(...args),
}));

jest.mock('../../utils/constants', () => ({ SYNC_DEBOUNCE_MS: 0 }));

function makeSupabaseChain(result: { error: null | { message: string } }) {
  const chain: Record<string, jest.Mock> = {};
  ['insert', 'update', 'delete', 'eq', 'select'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve),
  );
  return chain;
}

const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useOfflineSync } from '../../hooks/useOfflineSync';

describe('useOfflineSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSyncQueue.mockReturnValue([]);
    mockFrom.mockReturnValue(makeSupabaseChain({ error: null }));
  });

  it('mounts without error when queue is empty', () => {
    expect(() => {
      const { unmount } = renderHook(() => useOfflineSync());
      unmount();
    }).not.toThrow();
  });

  it('subscribes to NetInfo state changes on mount', () => {
    const { unmount } = renderHook(() => useOfflineSync());
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useOfflineSync());
    unmount();
    expect(mockNetInfoUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('processes insert item in sync queue when online', async () => {
    const insertItem = {
      id: 'item-1',
      table: 'workouts',
      operation: 'insert' as const,
      data: { name: 'Push Day' },
    };
    mockGetSyncQueue.mockReturnValue([insertItem]);

    const chain = makeSupabaseChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { unmount } = renderHook(() => useOfflineSync());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    unmount();

    expect(mockFrom).toHaveBeenCalledWith('workouts');
    expect(mockRemoveSyncQueueItem).toHaveBeenCalledWith('item-1');
  });

  it('processes update item in sync queue', async () => {
    const updateItem = {
      id: 'item-2',
      table: 'nutrition_logs',
      operation: 'update' as const,
      data: { id: 'row-42', calories: 500 },
    };
    mockGetSyncQueue.mockReturnValue([updateItem]);

    const chain = makeSupabaseChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { unmount } = renderHook(() => useOfflineSync());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    unmount();

    expect(mockFrom).toHaveBeenCalledWith('nutrition_logs');
    expect(mockRemoveSyncQueueItem).toHaveBeenCalledWith('item-2');
  });

  it('processes delete item in sync queue', async () => {
    const deleteItem = {
      id: 'item-3',
      table: 'workout_sets',
      operation: 'delete' as const,
      data: { id: 'row-7' },
    };
    mockGetSyncQueue.mockReturnValue([deleteItem]);

    const chain = makeSupabaseChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { unmount } = renderHook(() => useOfflineSync());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    unmount();

    expect(mockFrom).toHaveBeenCalledWith('workout_sets');
    expect(mockRemoveSyncQueueItem).toHaveBeenCalledWith('item-3');
  });

  it('does not remove item from queue when supabase returns an error', async () => {
    const insertItem = {
      id: 'item-err',
      table: 'workouts',
      operation: 'insert' as const,
      data: { name: 'Bad Day' },
    };
    mockGetSyncQueue.mockReturnValue([insertItem]);

    const chain = makeSupabaseChain({ error: { message: 'network error' } });
    mockFrom.mockReturnValue(chain);

    const { unmount } = renderHook(() => useOfflineSync());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    unmount();

    expect(mockRemoveSyncQueueItem).not.toHaveBeenCalled();
  });
});
