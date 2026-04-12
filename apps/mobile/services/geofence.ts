import * as Location from 'expo-location';
// @ts-ignore -- types may not be installed
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';

const GEOFENCE_TASK = 'TRANSFORMR_GEOFENCE';

interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') return false;

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return background === 'granted';
}

export async function startGeofencing(regions: GeofenceRegion[]): Promise<void> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) throw new Error('Location permissions not granted');

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

export async function stopGeofencing(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

export async function fetchUserGeofences(userId: string) {
  const { data, error } = await supabase
    .from('geofence_triggers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

export function convertToGeofenceRegions(
  triggers: Array<{
    id: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    trigger_on: string;
  }>,
): GeofenceRegion[] {
  return triggers.map((t) => ({
    identifier: t.id,
    latitude: t.latitude,
    longitude: t.longitude,
    radius: t.radius_meters,
    notifyOnEnter: t.trigger_on === 'enter' || t.trigger_on === 'both',
    notifyOnExit: t.trigger_on === 'exit' || t.trigger_on === 'both',
  }));
}

// Register the background task
TaskManager.defineTask(GEOFENCE_TASK, (taskBody: any) => {
  if (taskBody.error) return;

  const eventData = taskBody.data as {
    eventType: Location.GeofencingEventType;
    region: GeofenceRegion;
  };

  if (eventData.eventType === Location.GeofencingEventType.Enter) {
    handleGeofenceEnter(eventData.region.identifier);
  } else if (eventData.eventType === Location.GeofencingEventType.Exit) {
    handleGeofenceExit(eventData.region.identifier);
  }
});

function handleGeofenceEnter(triggerId: string) {
  // This will trigger the appropriate action based on the geofence config
  // Connected to the notification system and action routing
  console.warn(`Geofence entered: ${triggerId}`);
}

function handleGeofenceExit(triggerId: string) {
  console.warn(`Geofence exited: ${triggerId}`);
}
