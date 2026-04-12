// eslint-disable-next-line import/no-unresolved -- optional native module, installed at build time
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { supabase } from './supabase';

export async function initNfc(): Promise<boolean> {
  try {
    const isSupported = await NfcManager.isSupported();
    if (isSupported) {
      await NfcManager.start();
    }
    return isSupported;
  } catch {
    return false;
  }
}

export async function readNfcTag(): Promise<string | null> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
      const firstRecord = tag.ndefMessage[0];
      if (firstRecord) {
        const text = Ndef.text.decodePayload(new Uint8Array(firstRecord.payload));
        return text;
      }
    }

    // Fall back to tag ID
    return tag?.id ?? null;
  } catch {
    return null;
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export async function writeNfcTag(text: string): Promise<boolean> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
    if (bytes) {
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export async function fetchUserNfcTriggers(userId: string) {
  const { data, error } = await supabase
    .from('nfc_triggers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

export function executeNfcAction(action: string, _params?: Record<string, unknown>) {
  // Action routing - will be connected to navigation and store actions
  switch (action) {
    case 'start_workout':
      return { route: '/(tabs)/fitness/workout-player', params: _params };
    case 'open_meal_log':
      return { route: '/(tabs)/nutrition', params: undefined };
    case 'start_sleep':
      return { route: '/(tabs)/goals/sleep', params: undefined };
    case 'start_focus':
      return { route: '/(tabs)/goals/focus-mode', params: undefined };
    case 'log_water':
      return { route: '/(tabs)/nutrition', params: { action: 'water' } };
    default:
      return null;
  }
}

export function cleanupNfc() {
  NfcManager.cancelTechnologyRequest().catch(() => {});
}
