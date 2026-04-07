import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'transformr-storage',
});

// Typed storage helpers
export function setStorageItem(key: string, value: string): void {
  storage.set(key, value);
}

export function getStorageItem(key: string): string | undefined {
  return storage.getString(key);
}

export function setStorageNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function getStorageNumber(key: string): number | undefined {
  return storage.getNumber(key);
}

export function setStorageBool(key: string, value: boolean): void {
  storage.set(key, value);
}

export function getStorageBool(key: string): boolean | undefined {
  return storage.getBoolean(key);
}

export function setStorageJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function getStorageJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function removeStorageItem(key: string): void {
  storage.delete(key);
}

export function clearStorage(): void {
  storage.clearAll();
}

// Offline sync queue
const SYNC_QUEUE_KEY = 'offline_sync_queue';

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): void {
  const queue = getStorageJSON<SyncQueueItem[]>(SYNC_QUEUE_KEY) ?? [];
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  });
  setStorageJSON(SYNC_QUEUE_KEY, queue);
}

export function getSyncQueue(): SyncQueueItem[] {
  return getStorageJSON<SyncQueueItem[]>(SYNC_QUEUE_KEY) ?? [];
}

export function removeSyncQueueItem(id: string): void {
  const queue = getSyncQueue().filter((item) => item.id !== id);
  setStorageJSON(SYNC_QUEUE_KEY, queue);
}

export function clearSyncQueue(): void {
  removeStorageItem(SYNC_QUEUE_KEY);
}
