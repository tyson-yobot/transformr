/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// Type declarations for optional native modules that may not be installed
// in all environments. These are resolved at build time by the native toolchain.
// =============================================================================

declare module 'react-native-health' {
  const AppleHealthKit: any;
  export default AppleHealthKit;
  export const Constants: any;
}

declare module 'react-native-health-connect' {
  export function getSdkStatus(): Promise<number>;
  export function initialize(): Promise<void>;
  export function requestPermission(permissions: any[]): Promise<any[]>;
  export function readRecords(recordType: string, options: any): Promise<{ records: any[] }>;
  export const SdkAvailabilityStatus: { SDK_AVAILABLE: number };
}

declare module 'react-native-nfc-manager' {
  const NfcManager: any;
  export default NfcManager;
  export const NfcTech: any;
  export const Ndef: any;
}

declare module 'react-native-watch-connectivity' {
  export function sendMessage(message: any, reply?: any, error?: any): void;
  export function getReachability(): Promise<boolean>;
  export const watchEvents: {
    on(event: string, handler: (message: any) => void): () => void;
  };
}
