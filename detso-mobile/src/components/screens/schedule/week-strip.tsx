import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useT } from '@/src/features/i18n/store';
import {
  getWeekDays,
  isSameDay,
  isToday as isTodayFn,
  formatDateLocal,
  getDatesWithSchedules,
} from '@/src/lib/calendar-utils';
import { cn } from '@/src/lib/utils';
import { Schedule } from '@/src/lib/types';

interface WeekStripProps {
  selectedDate: Date;
  schedules: Schedule[];
  onDateSelect: (date: Date) => void;
}

export function WeekStrip({ selectedDate, schedules, onDateSelect }: WeekStripProps) {
  const { t } = useT();
  const weekDays = getWeekDays(selectedDate);

  // Pre-compute which dates have schedules (supports multi-day)
  const datesWithSchedules = getDatesWithSchedules(schedules);

  // Day name labels
  const dayLabels: string[] = (() => {
    const raw = t('schedule.dayNamesShort');
    if (Array.isArray(raw)) return raw;
    // Fallback
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  })();

  return (
    <View className="bg-card border-b border-border px-2 py-3">
      <View className="flex-row gap-1">
        {weekDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const today = isTodayFn(date);
          const dateStr = formatDateLocal(date);
          const hasEvents = datesWithSchedules.has(dateStr);

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onDateSelect(date)}
              className="flex-1"
              activeOpacity={0.7}
            >
              {/* Container with border for active date */}
              <View
                className={cn(
                  'items-center py-2 px-1 rounded-xl',
                  isSelected && 'bg-primary border-2 border-primary',
                  today && !isSelected && 'border-2 border-primary',
                  !isSelected && !today && 'border-2 border-transparent'
                )}
              >
                {/* Day name */}
                <Text
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-wider mb-1',
                    isSelected && 'text-primary-foreground',
                    today && !isSelected && 'text-primary',
                    !isSelected && !today && 'text-muted-foreground'
                  )}
                >
                  {dayLabels[index]}
                </Text>

                {/* Date number */}
                <Text
                  className={cn(
                    'text-base font-semibold',
                    isSelected && 'text-primary-foreground',
                    today && !isSelected && 'text-primary',
                    !isSelected && !today && 'text-foreground'
                  )}
                >
                  {date.getDate()}
                </Text>

                {/* Dot indicator for schedules */}
                <View className="h-1.5 mt-1 items-center justify-center">
                  {hasEvents && !isSelected && (
                    <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  {hasEvents && isSelected && (
                    <View className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
