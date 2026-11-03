import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ScreenWrapper } from '@/src/components/global/screen-wrapper';
import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Button } from '@/src/components/global/button';
import { EmptyState } from '@/src/components/global/empty-state';
import { Skeleton } from '@/src/components/global/skeleton';
import { SubStatCard } from '@/src/components/screens/dashboard/sub-stat-card';
import { GroupedSection } from '@/src/components/screens/dashboard/grouped-section';
import { TodayScheduleItem, TodayScheduleItemData } from '@/src/components/screens/dashboard/teknisi/today-schedule-item';
import { AssignedTicketItem } from '@/src/components/screens/dashboard/teknisi/assigned-ticket-item';

import { useAuthStore } from '@/src/features/auth/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useTeknisiActiveTickets } from '@/src/features/dashboard/teknisi-hooks';
import { useLanguageStore, useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { getSchedulesForDate } from '@/src/lib/calendar-utils';
import { formatScheduleTime, getScheduleStatusVariant } from '@/src/lib/schedule-utils';
import { ScheduleStatus } from '@/src/lib/types';

export default function TenantTeknisiDashboard() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);

  // Dihitung ulang tiap render (bukan useMemo) supaya "hari ini" self-heal
  // saat app dibiarkan terbuka lewat tengah malam / pergantian bulan —
  // re-render apa pun (pull-to-refresh, tab refocus) mengoreksi tanggalnya sendiri.
  const now = new Date();
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
  // Recompute murah (filter+sort atas list bulan berjalan) — tidak perlu useMemo,
  // dan menghindari dependency array yang harus melacak `now` per instant.
  const todaySchedules = getSchedulesForDate(schedules, now);
  // Metric "Tugas Hari Ini" hanya menghitung jadwal yang masih SCHEDULED —
  // CANCELLED/COMPLETED tetap muncul di daftar di bawah (dengan badge status),
  // tapi bukan "tugas" yang masih perlu dikerjakan hari ini.
  const todayScheduledCount = todaySchedules.filter((s) => s.status === 'SCHEDULED').length;

  // Compute Monday–Sunday of current week
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + diffToMonday + i);
    return d;
  });

  const activeJobIndex = todaySchedules.findIndex(
    (s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS',
  );
  const activeJob = activeJobIndex >= 0 ? todaySchedules[activeJobIndex] : undefined;
  const otherJobs =
    activeJobIndex >= 0
      ? todaySchedules.filter((_, idx) => idx !== activeJobIndex)
      : todaySchedules;

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
            <View className="flex-row gap-2.5 mb-5">
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
            </View>
            <Skeleton className="h-14 mb-5" />
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16" />
          </View>
        ) : (
          <>
            {/* (a) 3 SubStatCard row */}
            <View className="flex-row gap-2.5 mb-5">
              <SubStatCard
                label={t('teknisiDashboard.todaySchedules')}
                value={todayScheduledCount}
                dotColor={colors.primary}
              />
              <SubStatCard
                label={t('teknisiDashboard.activeTickets')}
                value={activeTickets?.length ?? 0}
                dotColor={colors.warning}
              />
              <SubStatCard
                label={t('teknisiDashboard.completedThisMonth')}
                value={statistics?.completed ?? 0}
                dotColor={colors.success}
              />
            </View>

            {/* Quick Actions (Flush 4-Tile Row) */}
            <View className="flex-row gap-2.5 mb-5">
              {[
                {
                  key: 'customers',
                  icon: 'people-outline' as const,
                  label: t('tenantDashboard.customers'),
                  route: '/customer' as const,
                },
                {
                  key: 'newCustomer',
                  icon: 'person-add-outline' as const,
                  label: t('teknisiDashboard.newCustomer'),
                  route: '/customer/create' as const,
                },
                {
                  key: 'services',
                  icon: 'wifi-outline' as const,
                  label: t('tenantDashboard.services'),
                  route: '/service' as const,
                },
                {
                  key: 'tickets',
                  icon: 'ticket-outline' as const,
                  label: t('tenantDashboard.tickets'),
                  route: '/ticket' as const,
                },
              ].map((action) => (
                <Pressable
                  key={action.key}
                  onPress={() => router.push(action.route)}
                  className="flex-1 bg-card border border-border rounded-2xl py-3 px-1.5 items-center justify-center"
                >
                  <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-1.5">
                    <Ionicons name={action.icon} size={20} color={colors.primary} />
                  </View>
                  <Text
                    weight="semibold"
                    className="text-xs text-foreground text-center"
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* (b) Horizontal 7-day strip */}
            <View className="flex-row gap-1.5 mb-5">
              {weekDays.map((d) => {
                const isToday =
                  d.getDate() === now.getDate() &&
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear();

                const weekdayShort = d.toLocaleDateString(
                  locale === 'id' ? 'id-ID' : 'en-US',
                  { weekday: 'short' },
                );

                return (
                  <View
                    key={d.toISOString()}
                    className={
                      isToday
                        ? 'flex-1 bg-primary border border-primary rounded-xl py-2 items-center'
                        : 'flex-1 bg-card border border-border rounded-xl py-2 items-center'
                    }
                  >
                    <Text
                      weight="semibold"
                      className={
                        isToday
                          ? 'text-[10px] uppercase text-primary-foreground/80'
                          : 'text-[10px] uppercase text-muted-foreground'
                      }
                    >
                      {weekdayShort}
                    </Text>
                    <Text
                      weight="bold"
                      className={
                        isToday
                          ? 'text-sm font-sf-bold text-primary-foreground mt-0.5'
                          : 'text-sm font-sf-bold text-foreground mt-0.5'
                      }
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* (c) Today's schedules */}
            {todaySchedules.length === 0 ? (
              <View className="mb-6">
                <Text weight="bold" className="text-lg text-foreground mb-2.5">
                  {t('teknisiDashboard.todayScheduleSection')}
                </Text>
                <EmptyState icon="calendar-outline" title={t('schedule.noSchedules')} />
              </View>
            ) : (
              <View className="mb-6">
                {activeJob ? (
                  <>
                    {otherJobs.length === 0 && (
                      <Text weight="bold" className="text-lg text-foreground mb-2.5">
                        {t('teknisiDashboard.todayScheduleSection')}
                      </Text>
                    )}
                    <View className="bg-card border-2 border-primary rounded-2xl p-4 mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text weight="semibold" className="text-xs text-muted-foreground">
                          {formatScheduleTime(
                            activeJob.start_time,
                            activeJob.end_time,
                            locale === 'en' ? 'en' : 'id',
                          )}
                        </Text>
                        <Badge
                          label={t(`schedule.status.${activeJob.status.toLowerCase()}`)}
                          colorVariant={getScheduleStatusVariant(activeJob.status as ScheduleStatus)}
                        />
                      </View>
                      <Text weight="bold" className="text-base font-sf-bold text-foreground">
                        {activeJob.title}
                      </Text>
                      {(activeJob.ticket?.customer?.name ||
                        activeJob.ticket?.service?.address ||
                        activeJob.ticket?.customer?.address) && (
                        <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                          {[
                            activeJob.ticket?.customer?.name,
                            activeJob.ticket?.service?.address ?? activeJob.ticket?.customer?.address,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      )}
                      <Button
                        size="sm"
                        title={t('teknisiDashboard.openDetail')}
                        onPress={() => router.push('/(tabs)/schedule')}
                        className="mt-3"
                      />
                    </View>
                  </>
                ) : null}

                {otherJobs.length > 0 ? (
                  <GroupedSection
                    title={t('teknisiDashboard.todayScheduleSection')}
                    className="mb-0"
                  >
                    {otherJobs.map((item, idx) => (
                      <TodayScheduleItem
                        key={item.id}
                        item={item}
                        isLast={idx === otherJobs.length - 1}
                      />
                    ))}
                  </GroupedSection>
                ) : null}
              </View>
            )}

            {/* (d) Active tickets */}
            {(activeTickets?.length ?? 0) === 0 ? (
              <View>
                <Text weight="bold" className="text-lg text-foreground mb-2.5">
                  {t('teknisiDashboard.ticketSection')}
                </Text>
                <EmptyState
                  icon="document-text-outline"
                  title={t('teknisiDashboard.noActiveTickets')}
                  description={t('teknisiDashboard.noActiveTicketsDesc')}
                />
              </View>
            ) : (
              <GroupedSection title={t('teknisiDashboard.ticketSection')}>
                {activeTickets!.map((ticket, idx) => (
                  <AssignedTicketItem
                    key={ticket.id}
                    ticket={ticket}
                    isLast={idx === activeTickets!.length - 1}
                  />
                ))}
              </GroupedSection>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
