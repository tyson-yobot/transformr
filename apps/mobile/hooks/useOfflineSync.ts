import { useEffect, useRef } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { supabase } from '@services/supabase';
import { getSyncQueue, removeSyncQueueItem } from '@utils/storage';
import { SYNC_DEBOUNCE_MS } from '@utils/constants';

export function useOfflineSync() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && !isSyncing.current) {
        processSyncQueue();
      }
    });

    // Also try on mount
    processSyncQueue();

    return () => unsubscribe();
  }, []);

  async function processSyncQueue() {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const queue = getSyncQueue();
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      for (const item of queue) {
        try {
          switch (item.operation) {
            case 'insert': {
              const { error } = await supabase.from(item.table).insert(item.data);
              if (!error) removeSyncQueueItem(item.id);
              break;
            }
            case 'update': {
              const { id: rowId, ...updateData } = item.data;
              const { error } = await supabase.from(item.table).update(updateData).eq('id', rowId);
              if (!error) removeSyncQueueItem(item.id);
              break;
            }
            case 'delete': {
              const { error } = await supabase.from(item.table).delete().eq('id', item.data.id);
              if (!error) removeSyncQueueItem(item.id);
              break;
            }
          }
          // Small delay between operations
          await new Promise((resolve) => setTimeout(resolve, SYNC_DEBOUNCE_MS));
        } catch {
          // Individual item failed, continue with others
          continue;
        }
      }
    } finally {
      isSyncing.current = false;
    }
  }
}
