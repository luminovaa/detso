import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/src/components/global/text';
import { Schedule, ScheduleStatus } from '@/src/lib/types';
import { HOUR_HEIGHT, TIME_LABEL_WIDTH, getBlockPosition } from '@/src/lib/calendar-utils';
import { hexToRgba, hexToRgb } from '@/src/lib/colors';

// ─── Status Colors ───────────────────────────────────────────────

const STATUS_STYLES: Record<ScheduleStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: {
    bg: hexToRgba('#0F766E', 0.15), // teal-700/15
    border: hexToRgb('#0F766E'), // teal-700
    text: hexToRgb('#0D9488'), // teal-600
  },
  COMPLETED: {
    bg: hexToRgba('#10B981', 0.15), // emerald-500/15
    border: hexToRgb('#10B981'), // emerald-500
    text: hexToRgb('#059669'), // emerald-600
  },
  CANCELLED: {
    bg: hexToRgba('#9CA3AF', 0.15), // gray-400/15
    border: hexToRgb('#9CA3AF'), // gray-400
    text: hexToRgb('#6B7280'), // gray-500
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

export const ScheduleBlock = React.memo(function ScheduleBlock({ schedule, segmentStart, segmentEnd, column, totalColumns, onPress }: ScheduleBlockProps) {
  const { top, height } = useMemo(() => getBlockPosition(segmentStart, segmentEnd), [segmentStart, segmentEnd]);
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
});
