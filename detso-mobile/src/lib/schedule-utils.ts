import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { ScheduleStatus } from './types';
import { BadgeVariantKey } from './badge-variants';

/**
 * Format schedule time range for display
 * Examples:
 * - Single day: "1 Mei 2026, 10:00 - 12:00"
 * - Multi-day: "1 Mei 2026, 22:00 - 5 Mei 2026, 18:00"
 */
export function formatScheduleTime(
  startTime: string,
  endTime?: string | null,
  locale: 'en' | 'id' = 'id'
): string {
  // Validate input
  if (!startTime) {
    return '-';
  }

  try {
    const start = new Date(startTime);
    
    // Check if date is valid
    if (isNaN(start.getTime())) {
      console.error('Invalid start_time:', startTime);
      return startTime; // Return original string if invalid
    }

    const end = endTime ? new Date(endTime) : null;
    
    // Check if end date is valid
    if (end && isNaN(end.getTime())) {
      console.error('Invalid end_time:', endTime);
      // Continue with just start time
    }

    const dateLocale = locale === 'id' ? id : enUS;
    const dateFormat = 'd MMM yyyy, HH:mm';

    const startStr = format(start, dateFormat, { locale: dateLocale });

    if (!end || isNaN(end.getTime())) return startStr;

    // Check if same day
    const isSameDay = 
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (isSameDay) {
      // Same day: "1 Mei 2026, 10:00 - 12:00"
      return `${format(start, 'd MMM yyyy, HH:mm', { locale: dateLocale })} - ${format(end, 'HH:mm')}`;
    } else {
      // Different days: "1 Mei 2026, 22:00 - 5 Mei 2026, 18:00"
      const endStr = format(end, dateFormat, { locale: dateLocale });
      return `${startStr} - ${endStr}`;
    }
  } catch (error) {
    console.error('Error formatting schedule time:', error, { startTime, endTime });
    return startTime || '-';
  }
}

/**
 * Get status badge variant for schedule status
 */
export function getScheduleStatusVariant(status: ScheduleStatus): BadgeVariantKey {
  switch (status) {
    case 'SCHEDULED':
      return 'info';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}
