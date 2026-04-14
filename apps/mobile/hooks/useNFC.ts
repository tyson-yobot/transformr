import { useState, useEffect, useCallback } from 'react';
import { initNfc, readNfcTag, fetchUserNfcTriggers, executeNfcAction, cleanupNfc } from '@services/nfc';
import { useAuthStore } from '@stores/authStore';
import { useRouter } from 'expo-router';

interface NfcTrigger {
  id: string;
  tag_id: string;
  label: string;
  action: string;
  action_params: Record<string, unknown> | null;
  is_active: boolean;
}

export function useNFC() {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [triggers, setTriggers] = useState<NfcTrigger[]>([]);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initNfc().then(setSupported);
    return () => { void cleanupNfc(); };
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserNfcTriggers(user.id).then((data) => {
        setTriggers((data ?? []) as NfcTrigger[]);
      });
    }
  }, [user?.id]);

  const scan = useCallback(async () => {
    if (!supported) return null;

    setScanning(true);
    try {
      const tagId = await readNfcTag();
      if (!tagId) return null;

      // Find matching trigger
      const trigger = triggers.find((t) => t.tag_id === tagId);
      if (trigger) {
        const result = executeNfcAction(trigger.action, trigger.action_params ?? undefined);
        if (result) {
          router.push(result.route as never);
        }
        return trigger;
      }

      return { tagId, matched: false };
    } finally {
      setScanning(false);
    }
  }, [supported, triggers, router]);

  return { supported, scanning, triggers, scan };
}
