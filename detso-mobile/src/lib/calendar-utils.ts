/**
 * Calendar utility functions for schedule day view
 */

// ─── Constants ───────────────────────────────────────────────────
export const HOUR_HEIGHT = 60; // pixels per hour row
export const START_HOUR = 0; // 00:00 (midnight)
export const END_HOUR = 23; // 23:00 (11 PM)
export const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 24 hours
export const TIMELINE_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
export const TIME_LABEL_WIDTH = 52; // width of the hour label column

// ─── Date Helpers ────────────────────────────────────────────────

/** Format date as YYYY-MM-DD (local timezone) */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Check if a date is today */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateLocal(date) === formatDateLocal(today);
}

/** Check if two dates are the same day */
export function isSameDay(a: Date, b: Date): boolean {
  return formatDateLocal(a) === formatDateLocal(b);
}

/** Check if a date is a weekend (Saturday or Sunday) */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ─── Week Helpers ────────────────────────────────────────────────

/** Get the 7 days of the week containing the given date (Sun-Sat) */
export function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    days.push(day);
  }
  return days;
}

/** Move date by N days */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Schedule Helpers ────────────────────────────────────────────

/**
 * Filter schedules that overlap with a specific date.
 * Supports multi-day schedules: a schedule appears on a date if
 * its start_time date <= date <= its end_time date.
 */
export function getSchedulesForDate<T extends { start_time?: Date | string; end_time?: Date | string | null }>(
  schedules: T[],
  date: Date
): T[] {
  const dateStr = formatDateLocal(date);

  return schedules
    .filter((schedule) => {
      if (!schedule.start_time) return false;
      const startDateStr = formatDateLocal(new Date(schedule.start_time));
      const endDateStr = schedule.end_time
        ? formatDateLocal(new Date(schedule.end_time))
        : startDateStr;

      // Schedule appears on this date if: startDate <= date <= endDate
      return startDateStr <= dateStr && dateStr <= endDateStr;
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_time!).getTime();
      const timeB = new Date(b.start_time!).getTime();
      return timeA - timeB;
    });
}

/**
 * Get the day-specific segment times for a schedule on a given view date.
 * For multi-day schedules, clamps start/end to the day boundaries.
 *
 * Example: Schedule 1 May 22:00 → 5 May 18:00
 *   - viewDate = 1 May → segmentStart = 22:00, segmentEnd = 23:59
 *   - viewDate = 3 May → segmentStart = 00:00, segmentEnd = 23:59
 *   - viewDate = 5 May → segmentStart = 00:00, segmentEnd = 18:00
 */
export function getSegmentForDate(
  schedule: { start_time: string | Date; end_time?: string | Date | null },
  viewDate: Date
): { segmentStart: string; segmentEnd: string } {
  const start = new Date(schedule.start_time);
  const end = schedule.end_time
    ? new Date(schedule.end_time)
    : new Date(start.getTime() + 3600000); // default 1hr

  // Day boundaries for viewDate
  const dayStart = new Date(viewDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(viewDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Clamp to day boundaries
  const clampedStart = start < dayStart ? dayStart : start;
  const clampedEnd = end > dayEnd ? dayEnd : end;

  return {
    segmentStart: clampedStart.toISOString(),
    segmentEnd: clampedEnd.toISOString(),
  };
}

/**
 * Get all date strings (YYYY-MM-DD) that have schedules,
 * including all intermediate dates for multi-day schedules.
 */
export function getDatesWithSchedules<T extends { start_time?: Date | string; end_time?: Date | string | null }>(
  schedules: T[]
): Set<string> {
  const dates = new Set<string>();

  schedules.forEach((s) => {
    if (!s.start_time) return;

    const startDate = new Date(s.start_time);
    const endDate = s.end_time ? new Date(s.end_time) : startDate;

    // Normalize to start of day for iteration
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const endDay = new Date(endDate);
    endDay.setHours(0, 0, 0, 0);

    // Add all dates from start to end (inclusive)
    while (current <= endDay) {
      dates.add(formatDateLocal(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return dates;
}

/** Check if a date has any schedules (supports multi-day) */
export function hasSchedules<T extends { start_time?: Date | string; end_time?: Date | string | null }>(
  schedules: T[],
  date: Date
): boolean {
  const dateStr = formatDateLocal(date);
  return schedules.some((s) => {
    if (!s.start_time) return false;
    const startDateStr = formatDateLocal(new Date(s.start_time));
    const endDateStr = s.end_time
      ? formatDateLocal(new Date(s.end_time))
      : startDateStr;
    return startDateStr <= dateStr && dateStr <= endDateStr;
  });
}

// ─── Timeline Position Helpers ───────────────────────────────────

/**
 * Calculate the top position and height of a schedule block on the timeline.
 * Returns { top, height } in pixels.
 */
export function getBlockPosition(
  startTime: string,
  endTime?: string | null
): { top: number; height: number } {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 3600000); // default 1hr

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return {
    top: Math.max(top, 0),
    height: Math.max(height, HOUR_HEIGHT * 0.5), // min 30px
  };
}

/**
 * Get the current time indicator position (pixels from top).
 * Returns null if current time is outside the visible range.
 */
export function getCurrentTimePosition(): number | null {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;

  if (minutes < startMinutes || minutes > endMinutes) return null;

  return ((minutes - startMinutes) / 60) * HOUR_HEIGHT;
}

/**
 * Format hour number to time string (e.g. 8 → "08:00")
 */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

// ─── Overlap / Column Layout ─────────────────────────────────────

interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

function toTimeRange(startTime: string, endTime?: string | null): TimeRange {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 3600000);
  return {
    startMinutes: start.getHours() * 60 + start.getMinutes(),
    endMinutes: end.getHours() * 60 + end.getMinutes(),
  };
}

function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Assign column indices to overlapping schedules.
 * Returns an array of { schedule, column, totalColumns } for each schedule.
 */
export function assignColumns<T extends { start_time: string; end_time?: string | null }>(
  schedules: T[]
): { schedule: T; column: number; totalColumns: number }[] {
  if (schedules.length === 0) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = [...schedules].sort((a, b) => {
    const aRange = toTimeRange(a.start_time, a.end_time);
    const bRange = toTimeRange(b.start_time, b.end_time);
    if (aRange.startMinutes !== bRange.startMinutes) {
      return aRange.startMinutes - bRange.startMinutes;
    }
    // Longer events first
    return (bRange.endMinutes - bRange.startMinutes) - (aRange.endMinutes - aRange.startMinutes);
  });

  const ranges = sorted.map((s) => toTimeRange(s.start_time, s.end_time));
  const columns: number[] = new Array(sorted.length).fill(0);

  // Greedy column assignment
  for (let i = 0; i < sorted.length; i++) {
    const usedCols = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (rangesOverlap(ranges[i], ranges[j])) {
        usedCols.add(columns[j]);
      }
    }
    // Find first available column
    let col = 0;
    while (usedCols.has(col)) col++;
    columns[i] = col;
  }

  // Determine total columns for each overlap group
  // For each schedule, find all overlapping schedules and get max column + 1
  const result = sorted.map((schedule, i) => {
    const overlapping = [i];
    for (let j = 0; j < sorted.length; j++) {
      if (j !== i && rangesOverlap(ranges[i], ranges[j])) {
        overlapping.push(j);
      }
    }
    const maxCol = Math.max(...overlapping.map((idx) => columns[idx]));
    return {
      schedule,
      column: columns[i],
      totalColumns: maxCol + 1,
    };
  });

  return result;
}

// ─── Month Name Helpers ──────────────────────────────────────────

const MONTH_NAMES = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  id: [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ],
};

/** Get month name from month index (0-11) */
export function getMonthName(monthIndex: number, locale: 'en' | 'id' = 'id'): string {
  return MONTH_NAMES[locale][monthIndex] || '';
}
