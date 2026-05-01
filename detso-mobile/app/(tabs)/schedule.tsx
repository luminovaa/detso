import React, { useState, useCallback, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenWrapper } from '@/src/components/global/screen-wrapper';
import { useT } from '@/src/features/i18n/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useAuthStore } from '@/src/features/auth/store';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { addDays } from '@/src/lib/calendar-utils';
import { Schedule } from '@/src/lib/types';

import { MonthNavigationControl } from '@/src/components/screens/schedule/month-navigation-control';
import { WeekStrip } from '@/src/components/screens/schedule/week-strip';
import { DayTimeline } from '@/src/components/screens/schedule/day-timeline';
import { ScheduleControls } from '@/src/components/screens/schedule/schedule-controls';
import { CreateScheduleSheet } from '@/src/components/screens/schedule/create-schedule-sheet';

// ─── Swipe Config ────────────────────────────────────────────────
const SWIPE_THRESHOLD = 50;
const SPRING_CONFIG = { damping: 20, stiffness: 250 };

export default function ScheduleScreen() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { width: screenWidth } = useWindowDimensions();
  const { contentPaddingBottom } = useTabBarHeight();
  const createSheetRef = useRef<BottomSheetModal>(null);

  // ─── State ───────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Derived values for API
  const month = selectedDate.getMonth() + 1; // API expects 1-12
  const year = selectedDate.getFullYear();

  // ─── Data Fetching ───────────────────────────────────────────
  // Fetch schedules for the entire month
  const { data, refetch, isRefetching } = useSchedules({
    month,
    year,
    technician_id: user?.role === 'TENANT_TEKNISI' ? user.id : undefined,
  });

  const schedules = (data?.data?.schedules || []) as Schedule[];

  // ─── Navigation Handlers ─────────────────────────────────────
  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, 1));
  }, []);

  const goToPrevDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, -1));
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

  // ─── Swipe Gesture ──────────────────────────────────────────
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only activate for horizontal swipes
    .failOffsetY([-10, 10]) // Fail if vertical (let ScrollView handle it)
    .onUpdate((e) => {
      // Clamp translation for visual feedback
      translateX.value = Math.max(
        Math.min(e.translationX, screenWidth * 0.3),
        -screenWidth * 0.3
      );
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        // Swipe left → next day
        translateX.value = withSpring(-screenWidth * 0.15, SPRING_CONFIG, () => {
          translateX.value = 0;
        });
        runOnJS(goToNextDay)();
      } else if (e.translationX > SWIPE_THRESHOLD) {
        // Swipe right → prev day
        translateX.value = withSpring(screenWidth * 0.15, SPRING_CONFIG, () => {
          translateX.value = 0;
        });
        runOnJS(goToPrevDay)();
      } else {
        // Snap back
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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
      onRefresh={refetch}
      refreshing={isRefetching}
      noPadding
    >
      <>
        {/* Main content */}
        <View className="flex-1">
          {/* Week strip: Sun Mon Tue Wed Thu Fri Sat */}
          <WeekStrip
            selectedDate={selectedDate}
            schedules={schedules}
            onDateSelect={goToDate}
          />

          {/* Swipeable day timeline */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[{ flex: 1 }, animatedStyle]}>
              <DayTimeline
                selectedDate={selectedDate}
                schedules={schedules}
                onSchedulePress={handleSchedulePress}
                contentPaddingBottom={contentPaddingBottom}
              />
            </Animated.View>
          </GestureDetector>
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
