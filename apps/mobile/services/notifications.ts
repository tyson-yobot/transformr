import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Fix A — Deferred notification handler setup
// Previously ran at module import time, which triggered native notification
// module initialization before the app was ready. Now lazily initialised on
// first call to registerForPushNotifications().
// ---------------------------------------------------------------------------
let handlerConfigured = false;

function ensureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  // Fix A — configure handler lazily on first registration attempt
  ensureNotificationHandler();

  const { granted: alreadyGranted } = await Notifications.getPermissionsAsync();
  let isGranted = alreadyGranted;

  if (!isGranted) {
    const { granted } = await Notifications.requestPermissionsAsync();
    isGranted = granted;
  }

  if (!isGranted) {
    return null;
  }

  // Fix B — wrap getExpoPushTokenAsync in try/catch so emulator environments
  // without Google Play Services (or missing project ID) don't throw unguarded.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  let token: Notifications.ExpoPushToken;
  try {
    token = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch (err) {
    console.warn('[notifications] getExpoPushTokenAsync failed:', err);
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A855F7',
    });

    Notifications.setNotificationChannelAsync('workout', {
      name: 'Workout',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    Notifications.setNotificationChannelAsync('nutrition', {
      name: 'Nutrition',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    Notifications.setNotificationChannelAsync('partner', {
      name: 'Partner',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return token.data;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, unknown>,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger,
  });
}

export async function scheduleDailyNotification(
  title: string,
  body: string,
  hour: number,
  minute: number,
  identifier: string,
): Promise<string> {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
