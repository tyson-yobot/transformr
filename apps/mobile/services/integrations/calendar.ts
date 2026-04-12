// =============================================================================
// TRANSFORMR -- Calendar Integration Service (Module 11)
// Reads device calendar events to detect free time blocks for workouts
// and suggests optimal training windows.
// =============================================================================

import { Platform } from 'react-native';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string | null;
}

export interface FreeTimeBlock {
  start: string;
  end: string;
  durationMinutes: number;
}

let ExpoCalendar: typeof import('expo-calendar') | null = null;

async function getCalendarModule(): Promise<typeof import('expo-calendar')> {
  if (!ExpoCalendar) {
    ExpoCalendar = await import('expo-calendar');
  }
  return ExpoCalendar;
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const Calendar = await getCalendarModule();
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const Calendar = await getCalendarModule();
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  const calendarIds = calendars.map((c) => c.id);

  if (calendarIds.length === 0) return [];

  const events = await Calendar.getEventsAsync(
    calendarIds,
    startOfDay,
    endOfDay,
  );

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate as unknown as string,
    endDate: e.endDate as unknown as string,
    allDay: e.allDay ?? false,
    location: e.location ?? null,
  }));
}

export async function getEventsForDateRange(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const Calendar = await getCalendarModule();
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  const calendarIds = calendars.map((c) => c.id);

  if (calendarIds.length === 0) return [];

  const events = await Calendar.getEventsAsync(
    calendarIds,
    startDate,
    endDate,
  );

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate as unknown as string,
    endDate: e.endDate as unknown as string,
    allDay: e.allDay ?? false,
    location: e.location ?? null,
  }));
}

export function findFreeTimeBlocks(
  events: CalendarEvent[],
  dayStart: number = 6,
  dayEnd: number = 22,
  minBlockMinutes: number = 30,
): FreeTimeBlock[] {
  const today = new Date();
  const dayStartTime = new Date(today);
  dayStartTime.setHours(dayStart, 0, 0, 0);
  const dayEndTime = new Date(today);
  dayEndTime.setHours(dayEnd, 0, 0, 0);

  const nonAllDay = events
    .filter((e) => !e.allDay)
    .map((e) => ({
      start: new Date(e.startDate).getTime(),
      end: new Date(e.endDate).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const blocks: FreeTimeBlock[] = [];
  let cursor = dayStartTime.getTime();

  for (const event of nonAllDay) {
    if (event.start > cursor) {
      const durationMinutes = Math.round((event.start - cursor) / 60000);
      if (durationMinutes >= minBlockMinutes) {
        blocks.push({
          start: new Date(cursor).toISOString(),
          end: new Date(event.start).toISOString(),
          durationMinutes,
        });
      }
    }
    cursor = Math.max(cursor, event.end);
  }

  // Check remaining time after last event
  if (cursor < dayEndTime.getTime()) {
    const durationMinutes = Math.round(
      (dayEndTime.getTime() - cursor) / 60000,
    );
    if (durationMinutes >= minBlockMinutes) {
      blocks.push({
        start: new Date(cursor).toISOString(),
        end: dayEndTime.toISOString(),
        durationMinutes,
      });
    }
  }

  return blocks;
}

export async function addWorkoutToCalendar(
  title: string,
  startDate: Date,
  endDate: Date,
): Promise<string | null> {
  try {
    const Calendar = await getCalendarModule();
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );

    const defaultCalendar =
      calendars.find((c) => c.isPrimary) ?? calendars[0];
    if (!defaultCalendar) return null;

    const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
      title: `TRANSFORMR: ${title}`,
      startDate,
      endDate,
      notes: 'Created by TRANSFORMR',
    });

    return eventId;
  } catch {
    return null;
  }
}
