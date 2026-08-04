import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ScreenWrapper } from '@/src/components/global/screen-wrapper';
import { Text } from '@/src/components/global/text';
import { EmptyState } from '@/src/components/global/empty-state';
import { Skeleton } from '@/src/components/global/skeleton';
import { MetricCard } from '@/src/components/screens/dashboard/metric-card';
import { TodayScheduleItem, TodayScheduleItemData } from '@/src/components/screens/dashboard/teknisi/today-schedule-item';
import { AssignedTicketItem } from '@/src/components/screens/dashboard/teknisi/assigned-ticket-item';

import { useAuthStore } from '@/src/features/auth/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useTeknisiActiveTickets } from '@/src/features/dashboard/teknisi-hooks';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { getSchedulesForDate } from '@/src/lib/calendar-utils';

export default function TenantTeknisiDashboard() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);

  const now = useMemo(() => new Date(), []);
  const {
    data: scheduleResp,
    isLoading: schedulesLoading,
    refetch: refetchSchedules,
  } = useSchedules({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    technician_id: user?.id,
  });
  const {
    data: activeTickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useTeknisiActiveTickets();

  const schedules = (scheduleResp?.data?.schedules ?? []) as TodayScheduleItemData[];
  const statistics = scheduleResp?.data?.statistics as
    | { total: number; scheduled: number; completed: number; cancelled: number }
    | undefined;
  const todaySchedules = useMemo(() => getSchedulesForDate(schedules, now), [schedules, now]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSchedules(), refetchTickets()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = schedulesLoading || ticketsLoading;

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View>
            <View className="flex-row gap-3 mb-6">
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
            </View>
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16" />
          </View>
        ) : (
          <>
            {/* Metrics */}
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                icon="calendar-outline"
                label={t('teknisiDashboard.todaySchedules')}
                value={todaySchedules.length}
                color={colors.primary}
              />
              <MetricCard
                icon="document-text-outline"
                label={t('teknisiDashboard.activeTickets')}
                value={activeTickets?.length ?? 0}
                color={colors.warning}
              />
              <MetricCard
                icon="checkmark-circle-outline"
                label={t('teknisiDashboard.completedThisMonth')}
                value={statistics?.completed ?? 0}
                color={colors.success}
              />
            </View>

            {/* Jadwal hari ini */}
            <Text weight="bold" className="text-lg text-foreground mb-3">
              {t('teknisiDashboard.todayScheduleSection')}
            </Text>
            {todaySchedules.length === 0 ? (
              <View className="mb-6">
                <EmptyState icon="calendar-outline" title={t('schedule.noSchedules')} />
              </View>
            ) : (
              <View className="mb-6">
                {todaySchedules.map((s) => (
                  <TodayScheduleItem key={s.id} schedule={s} />
                ))}
              </View>
            )}

            {/* Tiket aktif */}
            <Text weight="bold" className="text-lg text-foreground mb-3">
              {t('teknisiDashboard.ticketSection')}
            </Text>
            {(activeTickets?.length ?? 0) === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title={t('teknisiDashboard.noActiveTickets')}
                description={t('teknisiDashboard.noActiveTicketsDesc')}
              />
            ) : (
              <View>
                {activeTickets!.map((ticket) => (
                  <AssignedTicketItem key={ticket.id} ticket={ticket} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
