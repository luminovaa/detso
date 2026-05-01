import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/global/text';
import { useLanguageStore } from '@/src/features/i18n/store';
import { getMonthName } from '@/src/lib/calendar-utils';

interface MonthNavigationControlProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Compact month navigation control for header right side.
 * Shows: ← Mei 2025 →
 */
export function MonthNavigationControl({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: MonthNavigationControlProps) {
  const locale = useLanguageStore((s) => s.locale);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = getMonthName(month, locale);

  return (
    <View className="flex-row items-center gap-1">
      <TouchableOpacity
        onPress={onPrevMonth}
        className="w-7 h-7 items-center justify-center rounded-full active:bg-primary-foreground/20"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={18} color="white" />
      </TouchableOpacity>

      <Text className="text-sm font-semibold min-w-[100px] text-center text-primary-foreground">
        {monthName} {year}
      </Text>

      <TouchableOpacity
        onPress={onNextMonth}
        className="w-7 h-7 items-center justify-center rounded-full active:bg-primary-foreground/20"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-forward" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}
