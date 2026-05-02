import React, { useEffect, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useT } from '@/src/features/i18n/store';
import { Schedule } from '@/src/lib/types';
import {
  HOUR_HEIGHT,
  START_HOUR,
  END_HOUR,
  TIMELINE_HEIGHT,
  TIME_LABEL_WIDTH,
  formatDateLocal,
  formatHour,
  getCurrentTimePosition,
  isToday,
  getSchedulesForDate,
  getSegmentForDate,
  assignColumns,
} from '@/src/lib/calendar-utils';
import { ScheduleBlock } from './schedule-block';
import { COLORS } from '@/src/lib/colors';

// ─── Sub-components ──────────────────────────────────────────────

/** Horizontal grid line + hour label */
function HourRow({ hour }: { hour: number }) {
  return (
    <View
      style={{ height: HOUR_HEIGHT }}
      className="flex-row"
    >
      {/* Hour label */}
      <View style={{ width: TIME_LABEL_WIDTH }} className="items-end pr-2 -mt-2">
        <Text className="text-[10px] text-muted-foreground">{formatHour(hour)}</Text>
      </View>

      {/* Grid line */}
      <View className="flex-1 border-t border-border/40" />
    </View>
  );
}

/** Red line indicating current time */
function CurrentTimeIndicator({ top }: { top: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Red dot */}
      <View
        style={{
          width: TIME_LABEL_WIDTH,
          alignItems: 'flex-end',
          paddingRight: 4,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.status.error, // red-500
          }}
        />
      </View>

      {/* Red line */}
      <View
        style={{
          flex: 1,
          height: 2,
          backgroundColor: COLORS.status.error, // red-500
        }}
      />
    </View>
  );
}

/** Empty state when no schedules */
function EmptyState({ message }: { message: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: HOUR_HEIGHT * 4, // around 10:00
        left: TIME_LABEL_WIDTH + 16,
        right: 16,
        zIndex: 5,
      }}
      className="items-center py-6 px-4 rounded-xl bg-muted/30"
    >
      <Text className="text-sm text-muted-foreground text-center">{message}</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface DayTimelineProps {
  selectedDate: Date;
  schedules: Schedule[];
  onSchedulePress?: (schedule: Schedule) => void;
  contentPaddingBottom?: number;
}

export function DayTimeline({ 
  selectedDate, 
  schedules, 
  onSchedulePress,
  contentPaddingBottom = 40,
}: DayTimelineProps) {
  const { t } = useT();
  const scrollRef = useRef<ScrollView>(null);

  // Filter schedules for the selected date (supports multi-day schedules)
  const daySchedules = getSchedulesForDate(schedules, selectedDate);

  // Create day-specific segments (clamp multi-day schedules to day boundaries)
  const daySegments = daySchedules.map((schedule) => {
    const { segmentStart, segmentEnd } = getSegmentForDate(schedule, selectedDate);
    return {
      ...schedule,
      _segmentStart: segmentStart,
      _segmentEnd: segmentEnd,
    };
  });

  // Assign columns for overlapping schedules using segment times
  const segmentsForLayout = daySegments.map((seg) => ({
    ...seg,
    start_time: seg._segmentStart,
    end_time: seg._segmentEnd,
  }));
  const layoutItems = assignColumns(segmentsForLayout);

  // Current time indicator
  const showCurrentTime = isToday(selectedDate);
  const currentTimeTop = showCurrentTime ? getCurrentTimePosition() : null;

  // Auto-scroll to current time or first schedule on date change
  const dateKey = formatDateLocal(selectedDate);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTimeTop != null) {
        // Scroll to current time, centered
        scrollRef.current?.scrollTo({
          y: Math.max(currentTimeTop - 150, 0),
          animated: true,
        });
      } else if (daySegments.length > 0) {
        // Scroll to first schedule segment start on this day
        const firstSegmentStart = new Date(daySegments[0]._segmentStart);
        const firstHour = firstSegmentStart.getHours();
        const scrollY = Math.max((firstHour - START_HOUR - 1) * HOUR_HEIGHT, 0);
        scrollRef.current?.scrollTo({ y: scrollY, animated: true });
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  // Generate hour rows
  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
    >
      <View style={{ height: TIMELINE_HEIGHT, position: 'relative' }}>
        {/* Hour grid rows */}
        {hours.map((hour) => (
          <HourRow key={hour} hour={hour} />
        ))}

        {/* Current time indicator */}
        {currentTimeTop != null && <CurrentTimeIndicator top={currentTimeTop} />}

        {/* Schedule blocks */}
        {layoutItems.map(({ schedule, column, totalColumns }) => (
          <ScheduleBlock
            key={schedule.id}
            schedule={schedule}
            segmentStart={schedule._segmentStart}
            segmentEnd={schedule._segmentEnd}
            column={column}
            totalColumns={totalColumns}
            onPress={onSchedulePress}
          />
        ))}

        {/* Empty state */}
        {daySchedules.length === 0 && (
          <EmptyState message={t('schedule.noSchedules')} />
        )}
      </View>
    </ScrollView>
  );
}
