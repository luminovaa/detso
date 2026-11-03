import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { formatScheduleTime, getScheduleStatusVariant } from '@/src/lib/schedule-utils';
import { ScheduleStatus } from '@/src/lib/types';

export interface TodayScheduleItemData {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: ScheduleStatus | 'IN_PROGRESS';
  ticket?: {
    customer?: { name: string; address?: string | null } | null;
    service?: { address: string | null } | null;
  } | null;
  notes?: string | null;
}

export interface TodayScheduleItemProps {
  schedule?: TodayScheduleItemData;
  item?: TodayScheduleItemData;
  isLast?: boolean;
  highlight?: boolean;
}

export function TodayScheduleItem({
  schedule,
  item,
  isLast,
  highlight,
}: TodayScheduleItemProps) {
  const { t } = useT();
  const colors = useThemeColor();
  const locale = useLanguageStore((s) => s.locale);
  const data = (schedule ?? item)!;

  const containerClassName = highlight
    ? 'bg-card border-2 border-primary rounded-2xl p-4 mb-3 flex-row items-center justify-between gap-3'
    : `flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? '' : 'border-b border-border/60'}`;

  return (
    <Pressable
      className={containerClassName}
      onPress={() => router.push('/(tabs)/schedule')}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text weight="semibold" className="text-sm font-sf-semibold text-foreground" numberOfLines={1}>
            {data.title}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {formatScheduleTime(data.start_time, data.end_time, locale === 'en' ? 'en' : 'id')}
            {data.ticket?.customer?.name ? ` · ${data.ticket.customer.name}` : ''}
          </Text>
        </View>
      </View>
      <Badge
        label={t(`schedule.status.${data.status.toLowerCase()}`)}
        colorVariant={getScheduleStatusVariant(data.status as ScheduleStatus)}
      />
    </Pressable>
  );
}
