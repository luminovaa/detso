/**
 * Calendar utility functions for schedule calendar view
 */

/**
 * Get all days to display in a month calendar grid (including padding from prev/next month)
 * Returns array of dates for a 7-column grid (Sun-Sat)
 * 
 * @example
 * // If January 2026 starts on Thursday:
 * // Returns: [Dec 28, Dec 29, Dec 30, Dec 31, Jan 1, Jan 2, Jan 3, ...]
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  // month is 0-indexed (0 = January, 11 = December)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from the Sunday before the first day of the month
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // End on the Saturday after the last day of the month
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const days: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return days;
}

/**
 * Format date as YYYY-MM-DD (local timezone)
 * Used for comparing dates and grouping schedules
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateLocal(date) === formatDateLocal(today);
}

/**
 * Check if a date belongs to the current month
 */
export function isSameMonth(date: Date, currentDate: Date): boolean {
  return (
    date.getFullYear() === currentDate.getFullYear() &&
    date.getMonth() === currentDate.getMonth()
  );
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Filter schedules that match a specific date
 */
export function getSchedulesForDate<T extends { start_time?: Date | string }>(
  schedules: T[],
  date: Date
): T[] {
  const dateStr = formatDateLocal(date);

  return schedules.filter((schedule) => {
    if (!schedule.start_time) return false;

    const scheduleDate = new Date(schedule.start_time);
    const scheduleDateStr = formatDateLocal(scheduleDate);

    return scheduleDateStr === dateStr;
  });
}

/**
 * Get month name from month index (0-11)
 */
export function getMonthName(monthIndex: number, locale: 'en' | 'id' = 'id'): string {
  const monthNames = {
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    id: [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ],
  };

  return monthNames[locale][monthIndex] || '';
}

/**
 * Get short month name from month index (0-11)
 */
export function getMonthNameShort(monthIndex: number, locale: 'en' | 'id' = 'id'): string {
  const monthNames = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  };

  return monthNames[locale][monthIndex] || '';
}
