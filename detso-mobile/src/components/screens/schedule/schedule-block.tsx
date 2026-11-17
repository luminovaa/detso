import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/src/components/global/text';
import { Schedule, ScheduleStatus } from '@/src/lib/types';
import { HOUR_HEIGHT, TIME_LABEL_WIDTH, getBlockPosition } from '@/src/lib/calendar-utils';
import { useThemeColor, withOpacity } from '@/src/lib/theme-colors';

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
  const colors = useThemeColor();
  const { top, height } = useMemo(() => getBlockPosition(segmentStart, segmentEnd), [segmentStart, segmentEnd]);

  const STATUS_STYLES: Record<ScheduleStatus, { bg: string; border: string; text: string }> = useMemo(() => ({
    SCHEDULED: {
      bg: withOpacity(colors.primary, 0.15),
      border: colors.primary,
      text: colors.primary,
    },
    COMPLETED: {
      bg: withOpacity(colors.success, 0.15),
      border: colors.success,
      text: colors.success,
    },
    CANCELLED: {
      bg: withOpacity(colors.textDisabled, 0.15),
      border: colors.textDisabled,
      text: colors.icon,
    },
  }), [colors]);

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
