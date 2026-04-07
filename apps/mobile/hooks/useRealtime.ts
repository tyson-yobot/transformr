import { useEffect, useRef } from 'react';
import { supabase } from '@services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: Record<string, unknown>) => void;
  onUpdate?: (payload: Record<string, unknown>) => void;
  onDelete?: (payload: Record<string, unknown>) => void;
  onChange?: (payload: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useRealtime({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: RealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-${filter ?? 'all'}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const subscription = channel.on(
      'postgres_changes' as never,
      {
        event,
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        onChange?.(payload.new);

        switch (payload.eventType) {
          case 'INSERT':
            onInsert?.(payload.new);
            break;
          case 'UPDATE':
            onUpdate?.(payload.new);
            break;
          case 'DELETE':
            onDelete?.(payload.old);
            break;
        }
      },
    );

    subscription.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [table, event, filter, enabled, onInsert, onUpdate, onDelete, onChange]);

  return channelRef;
}
