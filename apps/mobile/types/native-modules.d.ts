// =============================================================================
// Type declarations for optional native modules that may not be installed
// in all environments. These are resolved at build time by the native toolchain.
// =============================================================================

declare module 'react-native-health' {
  export interface HealthKitOptions {
    permissions: {
      read: string[];
      write: string[];
    };
  }

  export interface HealthValue {
    value: number;
    startDate: string;
    endDate: string;
  }

  export interface HealthInputOptions {
    startDate?: string;
    endDate?: string;
    limit?: number;
    ascending?: boolean;
    type?: string;
    unit?: string;
    date?: string;
    value?: number;
  }

  export type HealthCallback<T> = (error: string | null, result: T) => void;

  export interface AppleHealthKitStatic {
    initHealthKit(options: HealthKitOptions, callback: HealthCallback<boolean>): void;
    isAvailable(callback: HealthCallback<boolean>): void;
    getStepCount(options: HealthInputOptions, callback: HealthCallback<HealthValue>): void;
    getDailyStepCountSamples(options: HealthInputOptions, callback: HealthCallback<HealthValue[]>): void;
    getHeartRateSamples(options: HealthInputOptions, callback: HealthCallback<HealthValue[]>): void;
    getSleepSamples(options: HealthInputOptions, callback: HealthCallback<HealthValue[]>): void;
    getActiveEnergyBurned(options: HealthInputOptions, callback: HealthCallback<HealthValue[]>): void;
    getRestingHeartRate(options: HealthInputOptions, callback: HealthCallback<HealthValue>): void;
    getBodyMassSamples(options: HealthInputOptions, callback: HealthCallback<HealthValue[]>): void;
    getLatestWeight(options: HealthInputOptions, callback: HealthCallback<HealthValue>): void;
    saveSteps(value: number, options: HealthInputOptions, callback: HealthCallback<boolean>): void;
    saveBodyMassSample(options: HealthInputOptions, callback: HealthCallback<boolean>): void;
  }

  export interface HealthConstants {
    Permissions: Record<string, string>;
    Units: Record<string, string>;
    Activities: Record<string, string>;
    Observers: Record<string, string>;
  }

  const AppleHealthKit: AppleHealthKitStatic;
  export default AppleHealthKit;
  export const Constants: HealthConstants;
}

declare module 'react-native-health-connect' {
  export function getSdkStatus(): Promise<number>;
  export function initialize(): Promise<void>;

  interface HealthConnectPermission {
    accessType: 'read' | 'write';
    recordType: string;
  }

  interface HealthRecord {
    startTime: string;
    endTime: string;
    count?: number;
    energy?: { inCalories: number };
    heartRateBpm?: number;
    weight?: { inKilograms: number };
    metadata?: { id: string };
  }

  interface ReadRecordsOptions {
    timeRangeFilter?: {
      operator: 'between' | 'before' | 'after';
      startTime?: string;
      endTime?: string;
    };
    pageSize?: number;
  }

  export function requestPermission(permissions: HealthConnectPermission[]): Promise<HealthConnectPermission[]>;
  export function readRecords(
    recordType: string,
    options: ReadRecordsOptions,
  ): Promise<{ records: HealthRecord[] }>;
  export const SdkAvailabilityStatus: { SDK_AVAILABLE: number };
}

declare module 'react-native-nfc-manager' {
  type NfcTechType = 'Ndef' | 'NfcA' | 'NfcB' | 'NfcF' | 'NfcV' | 'IsoDep' | 'MifareClassic' | 'MifareUltralight';

  interface NdefRecord {
    tnf: number;
    type: number[];
    id: number[];
    payload: number[];
  }

  interface NdefMessage {
    ndefMessage: NdefRecord[];
    type?: string;
    maxSize?: number;
    id?: string;
  }

  interface NfcManagerStatic {
    start(): Promise<void>;
    stop(): void;
    isSupported(): Promise<boolean>;
    isEnabled(): Promise<boolean>;
    requestTechnology(tech: NfcTechType | NfcTechType[]): Promise<void>;
    cancelTechnologyRequest(): Promise<void>;
    getTag(): Promise<NdefMessage | null>;
    setEventListener(event: string, callback: (tag: NdefMessage) => void): void;
    unregisterTagEvent(): Promise<void>;
    registerTagEvent(): Promise<void>;
    writeNdefMessage(message: NdefRecord[]): Promise<void>;
  }

  interface NdefStatic {
    encodeMessage(records: NdefRecord[]): number[];
    decodeMessage(bytes: number[]): NdefRecord[];
    textRecord(text: string, lang?: string): NdefRecord;
    uriRecord(uri: string): NdefRecord;
    stringify(record: NdefRecord): string;
  }

  interface NfcTechStatic {
    Ndef: 'Ndef';
    NfcA: 'NfcA';
    NfcB: 'NfcB';
    NfcF: 'NfcF';
    NfcV: 'NfcV';
    IsoDep: 'IsoDep';
    MifareClassic: 'MifareClassic';
    MifareUltralight: 'MifareUltralight';
  }

  const NfcManager: NfcManagerStatic;
  export default NfcManager;
  export const NfcTech: NfcTechStatic;
  export const Ndef: NdefStatic;
}

declare module 'react-native-watch-connectivity' {
  export interface WatchMessage {
    [key: string]: string | number | boolean | null;
  }

  type ReplyHandler = (reply: WatchMessage) => void;
  type ErrorHandler = (error: Error) => void;

  export function sendMessage(
    message: WatchMessage,
    reply?: ReplyHandler,
    error?: ErrorHandler,
  ): void;
  export function getReachability(): Promise<boolean>;
  export const watchEvents: {
    on(event: string, handler: (message: WatchMessage) => void): () => void;
  };
}
