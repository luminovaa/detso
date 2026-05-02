import React, { useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenWrapper } from '@/src/components/global/screen-wrapper';
import { useT } from '@/src/features/i18n/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useAuthStore } from '@/src/features/auth/store';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { Schedule } from '@/src/lib/types';

import { MonthNavigationControl } from '@/src/components/screens/schedule/month-navigation-control';
import { WeekStrip } from '@/src/components/screens/schedule/week-strip';
import { DayCarousel } from '@/src/components/screens/schedule/day-carousel';
import { ScheduleControls } from '@/src/components/screens/schedule/schedule-controls';
import { CreateScheduleSheet } from '@/src/components/screens/schedule/create-schedule-sheet';

export default function ScheduleScreen() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  const createSheetRef = useRef<BottomSheetModal>(null);

  // ─── State ───────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Derived values for API
  const month = selectedDate.getMonth() + 1; // API expects 1-12
  const year = selectedDate.getFullYear();

  // ─── Data Fetching ───────────────────────────────────────────
  const { data, refetch } = useSchedules({
    month,
    year,
    technician_id: user?.role === 'TENANT_TEKNISI' ? user.id : undefined,
  });

  const schedules = (data?.data?.schedules || []) as Schedule[];

  // ─── Navigation Handlers ─────────────────────────────────────
  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToPrevMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const handleSchedulePress = useCallback((schedule: Schedule) => {
    // TODO: Open detail bottom sheet
    console.log('Schedule pressed:', schedule.id);
  }, []);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <ScreenWrapper
      headerTitle={t('schedule.title')}
      headerRightNode={
        <MonthNavigationControl
          currentDate={selectedDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
        />
      }
      noPadding
    >
      <>
        {/* Main content */}
        <View className="flex-1 overflow-hidden">
          {/* Week strip: Sun Mon Tue Wed Thu Fri Sat */}
          <WeekStrip
            selectedDate={selectedDate}
            schedules={schedules}
            onDateSelect={goToDate}
          />

          {/* Swipeable 3-page day carousel (Google Calendar-like) */}
          <DayCarousel
            selectedDate={selectedDate}
            schedules={schedules}
            onDateChange={goToDate}
            onSchedulePress={handleSchedulePress}
            contentPaddingBottom={contentPaddingBottom}
          />
        </View>

        {/* Floating Controls - Absolutely positioned, outside scrollable content */}
        {user?.role !== 'TENANT_TEKNISI' && (
          <ScheduleControls onAddSchedule={() => createSheetRef.current?.present()} />
        )}

        {/* Create Schedule Bottom Sheet */}
        <CreateScheduleSheet
          ref={createSheetRef}
          defaultDate={selectedDate}
          onSuccess={refetch}
        />
      </>
    </ScreenWrapper>
  );
}
