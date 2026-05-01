import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useT } from '@/src/features/i18n/store';
import {
  getDaysInMonth,
  formatDateLocal,
  isToday,
  isSameMonth,
  isWeekend,
  getSchedulesForDate,
} from '@/src/lib/calendar-utils';
import { Schedule } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  schedules: Schedule[];
  onDatePress?: (date: Date, schedules: Schedule[]) => void;
}

export function CalendarGrid({ currentDate, schedules, onDatePress }: CalendarGridProps) {
  const { t } = useT();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  // Day name headers
  const dayNamesShort = t('schedule.dayNamesShort');
  const dayNames = Array.isArray(dayNamesShort) ? dayNamesShort : [];

  return (
    <View className="p-4">
      {/* Day headers */}
      <View className="flex-row mb-2">
        {dayNames.map((day, index) => (
          <View key={index} className="flex-1 items-center py-2">
            <Text className="text-xs font-medium text-muted-foreground">{day}</Text>
          </View>
        ))}
      </View>

      {/* Date cells */}
      <View className="flex-row flex-wrap">
        {days.map((date, index) => {
          const dateStr = formatDateLocal(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isWeekendDate = isWeekend(date);
          const dateSchedules = getSchedulesForDate(schedules, date);
          const scheduleCount = dateSchedules.length;

          return (
            <TouchableOpacity
              key={`${dateStr}-${index}`}
              onPress={() => onDatePress?.(date, dateSchedules)}
              disabled={!isCurrentMonth || scheduleCount === 0}
              className={cn(
                'border border-border/50 rounded-lg p-2 mb-2',
                'items-center justify-center',
                // Width: 14.28% = 1/7 of container (7 columns)
                'w-[13.5%] mx-[0.35%]',
                'min-h-[60px]',
                // Today indicator
                isTodayDate && 'ring-2 ring-accent',
                // Weekend tint
                isWeekendDate && 'bg-red-500/5',
                // Other month opacity
                !isCurrentMonth && 'opacity-40',
                // Active state
                isCurrentMonth && scheduleCount > 0 && 'active:bg-muted/50'
              )}
              accessibilityLabel={`${date.getDate()} ${
                scheduleCount > 0 ? `${scheduleCount} schedules` : ''
              }`}
            >
              {/* Date number */}
              <Text
                className={cn(
                  'text-sm font-medium',
                  isTodayDate && 'text-accent-foreground',
                  isWeekendDate && !isTodayDate && 'text-red-500',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {date.getDate()}
              </Text>

              {/* Schedule count badge */}
              {scheduleCount > 0 && isCurrentMonth && (
                <View className="bg-primary rounded-full px-2 py-0.5 mt-1 min-w-[20px] items-center">
                  <Text className="text-[10px] font-medium text-primary-foreground">
                    {scheduleCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
