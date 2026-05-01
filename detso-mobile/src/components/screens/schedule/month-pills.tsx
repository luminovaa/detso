import React, { useRef, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useLanguageStore } from '@/src/features/i18n/store';
import { getMonthNameShort } from '@/src/lib/calendar-utils';
import { cn } from '@/src/lib/utils';

interface MonthPillsProps {
  currentMonth: number; // 0-11
  currentYear: number;
  onMonthSelect: (month: number) => void;
}

export function MonthPills({ currentMonth, currentYear, onMonthSelect }: MonthPillsProps) {
  const locale = useLanguageStore((s) => s.locale);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to active month on mount
  useEffect(() => {
    // Delay to ensure layout is complete
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: currentMonth * 90 - 50, // Approximate pill width + margin
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentMonth]);

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <View className="bg-muted/30 border-b border-border">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        className="flex-row"
      >
        {months.map((monthIndex) => {
          const isActive = monthIndex === currentMonth;
          const monthName = getMonthNameShort(monthIndex, locale as 'en' | 'id');
          const yearShort = currentYear.toString().slice(-2);

          return (
            <TouchableOpacity
              key={monthIndex}
              onPress={() => onMonthSelect(monthIndex)}
              className={cn(
                'px-4 py-2 rounded-full mx-1 min-w-[80px] items-center',
                isActive
                  ? 'bg-primary shadow-sm'
                  : 'bg-card border border-border active:bg-muted'
              )}
              accessibilityLabel={`${monthName} ${currentYear}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-primary-foreground' : 'text-foreground'
                )}
              >
                {monthName} '{yearShort}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
