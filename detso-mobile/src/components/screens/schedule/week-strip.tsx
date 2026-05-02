import React, { useMemo, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
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

// Animation config
const SLIDE_DURATION = 250;
const SLIDE_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

export const WeekStrip = React.memo(function WeekStrip({ selectedDate, schedules, onDateSelect }: WeekStripProps) {
  const { t } = useT();
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Track previous week to detect week changes and animate
  const prevWeekStartRef = useRef<string>(formatDateLocal(weekDays[0]));
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const currentWeekStart = formatDateLocal(weekDays[0]);
    const prevWeekStart = prevWeekStartRef.current;

    if (currentWeekStart !== prevWeekStart) {
      // Determine direction: if new week is later → slide from right, else from left
      const direction = currentWeekStart > prevWeekStart ? 1 : -1;

      // Start off-screen in the direction we're coming from
      translateX.value = direction * 60;
      opacity.value = 0;

      // Animate to center
      translateX.value = withTiming(0, { duration: SLIDE_DURATION, easing: SLIDE_EASING });
      opacity.value = withTiming(1, { duration: SLIDE_DURATION, easing: SLIDE_EASING });

      prevWeekStartRef.current = currentWeekStart;
    }
  }, [weekDays]);

  // Pre-compute which dates have schedules (supports multi-day)
  const datesWithSchedules = useMemo(() => getDatesWithSchedules(schedules), [schedules]);

  // Day name labels
  const dayLabels: string[] = useMemo(() => {
    const raw = t('schedule.dayNamesShort');
    if (Array.isArray(raw)) return raw;
    // Fallback
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="bg-card border-b border-border px-2 py-3 overflow-hidden">
      <Animated.View style={[{ flexDirection: 'row', gap: 4 }, animatedStyle]}>
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
      </Animated.View>
    </View>
  );
});
