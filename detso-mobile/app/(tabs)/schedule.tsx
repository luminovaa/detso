import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useT } from '@/src/features/i18n/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useAuthStore } from '@/src/features/auth/store';
import { CalendarHeader } from '@/src/components/screens/schedule/calendar-header';
import { MonthPills } from '@/src/components/screens/schedule/month-pills';
import { CalendarGrid } from '@/src/components/screens/schedule/calendar-grid';
import { Schedule } from '@/src/lib/types';

export default function ScheduleScreen() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);

  // State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Derived values
  const month = currentDate.getMonth() + 1; // API expects 1-12
  const year = currentDate.getFullYear();

  // Fetch schedules for current month/year
  // If user is TENANT_TEKNISI, auto-filter by their ID
  const { data, isLoading, refetch, isRefetching } = useSchedules({
    month,
    year,
    technician_id: user?.role === 'TENANT_TEKNISI' ? user.id : undefined,
  });

  const schedules = (data?.data?.schedules || []) as Schedule[];

  // Handlers
  const handlePrevYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const handleDatePress = (date: Date, dateSchedules: Schedule[]) => {
    // TODO: Open bottom sheet with schedules for this date
    console.log('Date pressed:', date, 'Schedules:', dateSchedules.length);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPrevYear={handlePrevYear}
        onNextYear={handleNextYear}
        onToday={handleToday}
      />

      {/* Month pills */}
      <MonthPills
        currentMonth={currentDate.getMonth()}
        currentYear={currentDate.getFullYear()}
        onMonthSelect={handleMonthSelect}
      />

      {/* Calendar grid */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" className="text-primary" />
            <Text className="text-sm text-muted-foreground mt-4">
              {t('common.loading')}
            </Text>
          </View>
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            schedules={schedules}
            onDatePress={handleDatePress}
          />
        )}
      </ScrollView>
    </View>
  );
}
