/**
 * Gated logger for notifications lifecycle events.
 * - debug() messages only fire when EXPO_PUBLIC_DEBUG_NOTIFICATIONS=true
 * - warn() and error() always fire (real degradations)
 */
const DEBUG_NOTIFICATIONS =
  __DEV__ && process.env.EXPO_PUBLIC_DEBUG_NOTIFICATIONS === 'true';

type LogArgs = readonly unknown[];

export const notificationsLog = {
  debug: (message: string, ...args: LogArgs): void => {
    if (DEBUG_NOTIFICATIONS) {
      // eslint-disable-next-line no-console
      console.info(`[notifications] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: LogArgs): void => {
    console.warn(`[notifications] ${message}`, ...args);
  },
  error: (message: string, error?: unknown): void => {
    console.error(`[notifications] ${message}`, error);
  },
};
