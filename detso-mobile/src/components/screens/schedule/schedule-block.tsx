import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/src/components/global/text';
import { Schedule, ScheduleStatus } from '@/src/lib/types';
import { HOUR_HEIGHT, TIME_LABEL_WIDTH, getBlockPosition } from '@/src/lib/calendar-utils';

// ─── Status Colors ───────────────────────────────────────────────

const STATUS_STYLES: Record<ScheduleStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: {
    bg: 'rgba(59, 130, 246, 0.15)', // blue-500/15
    border: 'rgb(59, 130, 246)', // blue-500
    text: 'rgb(37, 99, 235)', // blue-600
  },
  COMPLETED: {
    bg: 'rgba(34, 197, 94, 0.15)', // green-500/15
    border: 'rgb(34, 197, 94)', // green-500
    text: 'rgb(22, 163, 74)', // green-600
  },
  CANCELLED: {
    bg: 'rgba(156, 163, 175, 0.15)', // gray-400/15
    border: 'rgb(156, 163, 175)', // gray-400
    text: 'rgb(107, 114, 128)', // gray-500
  },
};

// ─── Time Formatter ──────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Component ───────────────────────────────────────────────────

interface ScheduleBlockProps {
  schedule: Schedule;
  segmentStart: string; // Day-specific start time (clamped for multi-day)
  segmentEnd: string;   // Day-specific end time (clamped for multi-day)
  column: number;
  totalColumns: number;
  onPress?: (schedule: Schedule) => void;
}

export function ScheduleBlock({ schedule, segmentStart, segmentEnd, column, totalColumns, onPress }: ScheduleBlockProps) {
  const { top, height } = getBlockPosition(segmentStart, segmentEnd);
  const style = STATUS_STYLES[schedule.status] || STATUS_STYLES.SCHEDULED;

  // Calculate horizontal position for split columns
  const availableWidth = 100; // percentage
  const columnWidth = availableWidth / totalColumns;
  const left = column * columnWidth;
  const gap = totalColumns > 1 ? 1 : 0; // 1% gap between columns

  const isSmall = height < HOUR_HEIGHT * 0.75; // less than 45px

  return (
    <TouchableOpacity
      onPress={() => onPress?.(schedule)}
      activeOpacity={0.7}
      style={{
        position: 'absolute',
        top,
        left: `${left + gap / 2}%` as any,
        width: `${columnWidth - gap}%` as any,
        height: Math.max(height, 28),
        marginLeft: TIME_LABEL_WIDTH + 8, // offset for time labels
        zIndex: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: style.bg,
          borderLeftWidth: 3,
          borderLeftColor: style.border,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: isSmall ? 2 : 6,
          overflow: 'hidden',
        }}
      >
        {/* Title */}
        <Text
          numberOfLines={isSmall ? 1 : 2}
          style={{ color: style.text, fontSize: 12, fontWeight: '600', lineHeight: 16 }}
        >
          {schedule.title || 'Untitled'}
        </Text>

        {/* Time + Technician (only if enough space) */}
        {!isSmall && (
          <>
            <Text
              numberOfLines={1}
              style={{ color: style.text, fontSize: 10, opacity: 0.8, marginTop: 2 }}
            >
              {formatTime(segmentStart)}
              {segmentEnd ? ` - ${formatTime(segmentEnd)}` : ''}
            </Text>

            {schedule.technician?.full_name && (
              <Text
                numberOfLines={1}
                style={{ color: style.text, fontSize: 10, opacity: 0.7, marginTop: 1 }}
              >
                {schedule.technician.full_name}
              </Text>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
