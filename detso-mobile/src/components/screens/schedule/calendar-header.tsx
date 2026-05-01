import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/global/text';
import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { getMonthName } from '@/src/lib/calendar-utils';
import { cn } from '@/src/lib/utils';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevYear: () => void;
  onNextYear: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPrevYear,
  onNextYear,
  onToday,
}: CalendarHeaderProps) {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = getMonthName(month, locale as 'en' | 'id');

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
      {/* Year navigation */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onPrevYear}
          className="w-8 h-8 items-center justify-center rounded-lg bg-muted active:bg-muted/80"
          accessibilityLabel="Previous year"
        >
          <Ionicons name="chevron-back" size={20} color="currentColor" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold min-w-[60px] text-center">{year}</Text>

        <TouchableOpacity
          onPress={onNextYear}
          className="w-8 h-8 items-center justify-center rounded-lg bg-muted active:bg-muted/80"
          accessibilityLabel="Next year"
        >
          <Ionicons name="chevron-forward" size={20} color="currentColor" />
        </TouchableOpacity>
      </View>

      {/* Current month display */}
      <Text className="text-sm text-muted-foreground">
        {monthName} {year}
      </Text>

      {/* Today button */}
      <TouchableOpacity
        onPress={onToday}
        className={cn(
          'px-3 py-1.5 rounded-lg bg-primary active:bg-primary/90',
          'min-w-[60px] items-center'
        )}
        accessibilityLabel="Go to today"
      >
        <Text className="text-sm font-medium text-primary-foreground">{t('schedule.today')}</Text>
      </TouchableOpacity>
    </View>
  );
}
