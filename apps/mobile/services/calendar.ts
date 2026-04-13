// =============================================================================
// TRANSFORMR -- Calendar Integration Service (Module 11)
// Adds, reads, and removes workout events from the device calendar.
// Uses expo-calendar with graceful fallback if permissions are denied.
// =============================================================================

import * as ExpoCalendar from 'expo-calendar';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getDefaultCalendarId(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') {
      const defaultCalendar = await ExpoCalendar.getDefaultCalendarAsync();
      return defaultCalendar?.id ?? null;
    }

    // Android — find a writable calendar
    const calendars = await ExpoCalendar.getCalendarsAsync(
      ExpoCalendar.EntityTypes.EVENT,
    );
    const writable = calendars.find(
      (c) =>
        c.allowsModifications &&
        c.type !== ExpoCalendar.CalendarType.BIRTHDAYS,
    );
    return writable?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// requestCalendarPermissions
// ---------------------------------------------------------------------------

/**
 * Requests read/write calendar permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// addWorkoutToCalendar
// ---------------------------------------------------------------------------

/**
 * Adds a workout event to the device calendar.
 * @returns The calendar event ID, or null if the operation fails.
 */
export async function addWorkoutToCalendar(workout: {
  name: string;
  startTime: Date;
  durationMin: number;
  notes?: string;
}): Promise<string | null> {
  try {
    const { status } = await ExpoCalendar.getCalendarPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestCalendarPermissions();
      if (!granted) return null;
    }

    const calendarId = await getDefaultCalendarId();
    if (!calendarId) return null;

    const endTime = new Date(
      workout.startTime.getTime() + workout.durationMin * 60_000,
    );

    const eventId = await ExpoCalendar.createEventAsync(calendarId, {
      title: `💪 ${workout.name}`,
      startDate: workout.startTime,
      endDate: endTime,
      notes: workout.notes ?? 'Logged via TRANSFORMR',
      alarms: [{ relativeOffset: -15 }], // 15-minute reminder
    });

    return eventId;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getUpcomingWorkouts
// ---------------------------------------------------------------------------

/**
 * Returns upcoming calendar events with workout-related titles.
 * @param days - Look-ahead window in days (default 7)
 */
export async function getUpcomingWorkouts(days = 7): Promise<CalendarEvent[]> {
  try {
    const { status } = await ExpoCalendar.getCalendarPermissionsAsync();
    if (status !== 'granted') return [];

    const calendars = await ExpoCalendar.getCalendarsAsync(
      ExpoCalendar.EntityTypes.EVENT,
    );
    const calendarIds = calendars.map((c) => c.id);
    if (calendarIds.length === 0) return [];

    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 3600 * 1000);

    const events = await ExpoCalendar.getEventsAsync(
      calendarIds,
      startDate,
      endDate,
    );

    // Filter for workout-related events (created by TRANSFORMR or with fitness keywords)
    const workoutKeywords = [
      'workout',
      'training',
      'gym',
      'run',
      'lift',
      'exercise',
      'class',
      '💪',
      'transformr',
    ];

    return events
      .filter((e) => {
        const title = e.title?.toLowerCase() ?? '';
        return workoutKeywords.some((kw) => title.includes(kw));
      })
      .map((e) => ({
        id: e.id,
        title: e.title ?? 'Workout',
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
        notes: e.notes ?? undefined,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// removeCalendarEvent
// ---------------------------------------------------------------------------

/**
 * Removes a calendar event by its event ID.
 * Fails silently if the event no longer exists.
 */
export async function removeCalendarEvent(eventId: string): Promise<void> {
  try {
    await ExpoCalendar.deleteEventAsync(eventId);
  } catch {
    // Event may already be deleted
  }
}
