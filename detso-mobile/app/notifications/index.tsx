import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { EmptyState } from "@/src/components/global/empty-state";
import { Skeleton } from "@/src/components/global/skeleton";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";

import { useAuthStore } from "@/src/features/auth/store";
import { useTickets } from "@/src/features/ticket/hooks";
import { useSchedules } from "@/src/features/schedule/hooks";
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { getSchedulesForDate } from "@/src/lib/calendar-utils";
import { formatScheduleTime, getScheduleStatusVariant } from "@/src/lib/schedule-utils";
import { TICKET_PRIORITY_VARIANTS } from "@/src/lib/ticket-constants";
import { formatRelativeTime } from "@/src/lib/format-date";
import { Ticket, Schedule } from "@/src/lib/types";
import { useThemeColor } from "@/src/lib/theme-colors";

/**
 * Notification & operational alerts hub showing urgent/open tickets and today's schedules.
 */
export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();

  if (user?.role === "SAAS_SUPER_ADMIN") {
    return (
      <ScreenWrapper headerTitle={t("notifications.title")} showBackButton>
        <View className="flex-1 justify-center">
          <EmptyState
            icon="notifications-outline"
            title={t("notifications.emptyTitle")}
            description={t("notifications.superAdminDesc")}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return <TenantNotificationsContent userId={user?.id} role={user?.role} />;
}

interface TenantNotificationsProps {
  userId?: string;
  role?: string;
}

function TenantNotificationsContent({ userId, role }: TenantNotificationsProps) {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const colors = useThemeColor();
  const now = new Date();
  const isTechnician = role === "TENANT_TEKNISI";

  const { data: ticketRes, isLoading: ticketsLoading } = useTickets({
    page: 1,
    limit: 10,
  });

  const { data: scheduleRes, isLoading: schedulesLoading } = useSchedules({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    ...(isTechnician && userId ? { technician_id: userId } : {}),
  });

  const allTickets = (ticketRes?.data?.tickets ?? []) as Ticket[];
  const activeTickets = allTickets.filter(
    (tk) =>
      (tk.status === "OPEN" || tk.status === "IN_PROGRESS") &&
      (!isTechnician || !userId || !tk.technician || tk.technician.id === userId)
  );

  const allSchedules = (scheduleRes?.data?.schedules ?? []) as Schedule[];
  const todaySchedules = getSchedulesForDate(allSchedules, now);

  const isLoading = ticketsLoading || schedulesLoading;

  return (
    <ScreenWrapper headerTitle={t("notifications.title")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="gap-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </View>
        ) : activeTickets.length === 0 && todaySchedules.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={t("notifications.emptyTitle")}
            description={t("notifications.emptyDesc")}
          />
        ) : (
          <>
            {todaySchedules.length > 0 && (
              <GroupedSection
                title={t("notifications.todaySchedules")}
                actionLabel={t("notifications.viewAllSchedules")}
                onAction={() => router.replace("/(tabs)/schedule")}
              >
                {todaySchedules.map((sch, idx) => (
                  <TouchableOpacity
                    key={sch.id}
                    activeOpacity={0.7}
                    onPress={() => router.replace("/(tabs)/schedule")}
                    className={`px-4 py-3.5 flex-row items-center justify-between gap-3 ${
                      idx === todaySchedules.length - 1 ? "" : "border-b border-border/60"
                    }`}
                  >
                    <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text weight="semibold" className="text-sm text-foreground" numberOfLines={1}>
                        {sch.title || t("schedule.untitled")}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {formatScheduleTime(sch.start_time, sch.end_time, locale as "en" | "id")}
                      </Text>
                    </View>
                    <Badge colorVariant={getScheduleStatusVariant(sch.status)}>
                      {t(`schedule.status.${sch.status.toLowerCase()}`)}
                    </Badge>
                  </TouchableOpacity>
                ))}
              </GroupedSection>
            )}

            {activeTickets.length > 0 && (
              <GroupedSection
                title={t("notifications.urgentTickets")}
                actionLabel={t("notifications.viewAllTickets")}
                onAction={() => router.push("/ticket")}
              >
                {activeTickets.map((tk, idx) => (
                  <TouchableOpacity
                    key={tk.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/ticket/${tk.id}/detail` as never)}
                    className={`px-4 py-3.5 flex-row items-center justify-between gap-3 ${
                      idx === activeTickets.length - 1 ? "" : "border-b border-border/60"
                    }`}
                  >
                    <View className="w-9 h-9 rounded-xl bg-amber-500/10 items-center justify-center">
                      <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                    </View>
                    <View className="flex-1">
                      <Text weight="semibold" className="text-sm text-foreground" numberOfLines={1}>
                        {tk.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {tk.customer?.name} • {formatRelativeTime(tk.created_at, locale)}
                      </Text>
                    </View>
                    <Badge colorVariant={TICKET_PRIORITY_VARIANTS[tk.priority] || "neutral"}>
                      {t(
                        `ticket.priority${tk.priority.charAt(0) + tk.priority.slice(1).toLowerCase()}`
                      )}
                    </Badge>
                  </TouchableOpacity>
                ))}
              </GroupedSection>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
