import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { formatScheduleTime, getScheduleStatusVariant } from '@/src/lib/schedule-utils';

export interface TodayScheduleItemData {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  ticket?: { customer?: { name: string } | null } | null;
}

export function TodayScheduleItem({ schedule }: { schedule: TodayScheduleItemData }) {
  const { t } = useT();
  const colors = useThemeColor();
  const locale = useLanguageStore((s) => s.locale);

  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center"
      activeOpacity={0.7}
      onPress={() => router.push('/(tabs)/schedule')}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </View>
      <View className="flex-1 mr-2">
        <Text weight="semibold" className="text-foreground" numberOfLines={1}>
          {schedule.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {formatScheduleTime(schedule.start_time, schedule.end_time, locale === 'en' ? 'en' : 'id')}
          {schedule.ticket?.customer?.name ? ` · ${schedule.ticket.customer.name}` : ''}
        </Text>
      </View>
      <Badge
        label={t(`schedule.status.${schedule.status.toLowerCase()}`)}
        colorVariant={getScheduleStatusVariant(schedule.status)}
      />
    </TouchableOpacity>
  );
}
