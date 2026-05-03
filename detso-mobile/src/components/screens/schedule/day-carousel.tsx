/**
 * DAY CAROUSEL
 *
 * Google Calendar-like 3-page swipeable day view.
 *
 * Architecture:
 * ┌──────────────────────────────────────────────────────┐
 * │  [Prev Day]  │  [Current Day]  │  [Next Day]        │
 * │  (off-screen) │  (visible)      │  (off-screen)      │
 * └──────────────────────────────────────────────────────┘
 *
 * - Renders 3 DayTimeline pages side-by-side in a wide Animated.View
 * - Pan gesture moves all 3 pages horizontally (follows finger)
 * - On release: velocity + distance threshold → snap to prev/next or cancel
 * - After snap animation completes → update selectedDate, reset offset to center
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { addDays } from '@/src/lib/calendar-utils';
import { Schedule } from '@/src/lib/types';
import { DayTimeline } from './day-timeline';

// ─── Config ──────────────────────────────────────────────────────
const VELOCITY_THRESHOLD = 500; // px/s — fast swipe triggers even with short distance
const DISTANCE_THRESHOLD_RATIO = 0.25; // 25% of screen width
const SNAP_DURATION = 280; // ms — animation duration for snap
const SNAP_EASING = Easing.bezier(0.25, 0.1, 0.25, 1); // ease-out cubic

interface DayCarouselProps {
  selectedDate: Date;
  schedules: Schedule[];
  onDateChange: (date: Date) => void;
  onSchedulePress?: (schedule: Schedule) => void;
  contentPaddingBottom?: number;
}

export function DayCarousel({
  selectedDate,
  schedules,
  onDateChange,
  onSchedulePress,
  contentPaddingBottom = 40,
}: DayCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Compute prev/next dates
  const prevDate = useMemo(() => addDays(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  // Shared value for horizontal offset (0 = centered on current day)
  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  // ─── Reset position when selectedDate changes ──────────────────
  // This ensures translateX is reset after navigation completes,
  // preventing Reanimated warnings about writing during render
  useEffect(() => {
    translateX.value = 0;
    isAnimating.value = false;
  }, [selectedDate]);

  // ─── Navigation callbacks (called from UI thread via runOnJS) ──
  const goToPrev = useCallback(() => {
    onDateChange(addDays(selectedDate, -1));
  }, [selectedDate, onDateChange]);

  const goToNext = useCallback(() => {
    onDateChange(addDays(selectedDate, 1));
  }, [selectedDate, onDateChange]);

  // ─── Pan Gesture ───────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // Activate only for horizontal movement
    .failOffsetY([-10, 10]) // Fail if vertical (let ScrollView handle it)
    .onStart(() => {
      // If still animating from previous swipe, cancel the gesture
      if (isAnimating.value) return;
    })
    .onUpdate((e) => {
      if (isAnimating.value) return;
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (isAnimating.value) return;

      const distanceThreshold = screenWidth * DISTANCE_THRESHOLD_RATIO;
      const absX = Math.abs(e.translationX);
      const absVelocity = Math.abs(e.velocityX);

      // Determine direction: negative = swipe left (next day), positive = swipe right (prev day)
      const isSwipeLeft = e.translationX < 0;
      const shouldSnap = absX > distanceThreshold || absVelocity > VELOCITY_THRESHOLD;

      if (shouldSnap && isSwipeLeft) {
        // Snap to next day (slide left by screenWidth)
        isAnimating.value = true;
        translateX.value = withTiming(
          -screenWidth,
          { duration: SNAP_DURATION, easing: SNAP_EASING },
          (finished) => {
            if (finished) {
              // Reset will be handled by useEffect when selectedDate changes
              runOnJS(goToNext)();
            }
          },
        );
      } else if (shouldSnap && !isSwipeLeft) {
        // Snap to prev day (slide right by screenWidth)
        isAnimating.value = true;
        translateX.value = withTiming(
          screenWidth,
          { duration: SNAP_DURATION, easing: SNAP_EASING },
          (finished) => {
            if (finished) {
              // Reset will be handled by useEffect when selectedDate changes
              runOnJS(goToPrev)();
            }
          },
        );
      } else {
        // Cancel — snap back to center
        isAnimating.value = false;
        translateX.value = withTiming(0, {
          duration: 200,
          easing: SNAP_EASING,
        });
      }
    });

  // ─── Animated Styles ───────────────────────────────────────────
  // The container is 3x screen width, initially offset by -screenWidth to center the middle page
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - screenWidth }],
  }));

  // ─── Render ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              width: screenWidth * 3,
              height: '100%',
            },
            containerStyle,
          ]}
        >
          {/* Page 0: Previous Day */}
          <View style={{ width: screenWidth, height: '100%' }}>
            <DayTimeline
              selectedDate={prevDate}
              schedules={schedules}
              onSchedulePress={onSchedulePress}
              contentPaddingBottom={contentPaddingBottom}
            />
          </View>

          {/* Page 1: Current Day (visible) */}
          <View style={{ width: screenWidth, height: '100%' }}>
            <DayTimeline
              selectedDate={selectedDate}
              schedules={schedules}
              onSchedulePress={onSchedulePress}
              contentPaddingBottom={contentPaddingBottom}
            />
          </View>

          {/* Page 2: Next Day */}
          <View style={{ width: screenWidth, height: '100%' }}>
            <DayTimeline
              selectedDate={nextDate}
              schedules={schedules}
              onSchedulePress={onSchedulePress}
              contentPaddingBottom={contentPaddingBottom}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
