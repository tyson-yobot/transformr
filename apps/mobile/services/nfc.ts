import { supabase } from './supabase';

// react-native-nfc-manager is an optional native module.
// Use dynamic imports so Metro doesn't crash when building on machines
// where the native module is not linked (e.g. Expo Go, CI).

type NfcManagerType = typeof import('react-native-nfc-manager').default;
type NfcTechType = typeof import('react-native-nfc-manager').NfcTech;
type NdefType = typeof import('react-native-nfc-manager').Ndef;

let _NfcManager: NfcManagerType | null = null;
let _NfcTech: NfcTechType | null = null;
let _Ndef: NdefType | null = null;

async function getNfcModule(): Promise<{
  NfcManager: NfcManagerType;
  NfcTech: NfcTechType;
  Ndef: NdefType;
} | null> {
  if (_NfcManager && _NfcTech && _Ndef) return { NfcManager: _NfcManager, NfcTech: _NfcTech, Ndef: _Ndef };
  try {
    const mod = await import('react-native-nfc-manager');
    _NfcManager = mod.default;
    _NfcTech = mod.NfcTech;
    _Ndef = mod.Ndef;
    return { NfcManager: _NfcManager, NfcTech: _NfcTech, Ndef: _Ndef };
  } catch {
    return null;
  }
}

export async function initNfc(): Promise<boolean> {
  try {
    const nfc = await getNfcModule();
    if (!nfc) return false;
    const isSupported = await nfc.NfcManager.isSupported();
    if (isSupported) {
      await nfc.NfcManager.start();
    }
    return isSupported;
  } catch {
    return false;
  }
}

export async function readNfcTag(): Promise<string | null> {
  try {
    const nfc = await getNfcModule();
    if (!nfc) return null;
    await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
    const tag = await nfc.NfcManager.getTag();

    if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
      const firstRecord = tag.ndefMessage[0];
      if (firstRecord) {
        const text = nfc.Ndef.text.decodePayload(new Uint8Array(firstRecord.payload));
        return text;
      }
    }

    return tag?.id ?? null;
  } catch {
    return null;
  } finally {
    const nfc = await getNfcModule();
    nfc?.NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export async function writeNfcTag(text: string): Promise<boolean> {
  try {
    const nfc = await getNfcModule();
    if (!nfc) return false;
    await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
    const bytes = nfc.Ndef.encodeMessage([nfc.Ndef.textRecord(text)]);
    if (bytes) {
      await nfc.NfcManager.ndefHandler.writeNdefMessage(bytes);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    const nfc = await getNfcModule();
    nfc?.NfcManager.cancelTechnologyRequest().catch(() => {});
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

export async function cleanupNfc() {
  const nfc = await getNfcModule();
  nfc?.NfcManager.cancelTechnologyRequest().catch(() => {});
}
