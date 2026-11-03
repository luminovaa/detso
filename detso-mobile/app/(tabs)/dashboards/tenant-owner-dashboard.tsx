import React from "react";
import { View, ScrollView, RefreshControl, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { Text } from "@/src/components/global/text";

import { HeroStatCard } from "@/src/components/screens/dashboard/hero-stat-card";
import { SubStatCard } from "@/src/components/screens/dashboard/sub-stat-card";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
import { RecentTicketItem } from "@/src/components/screens/dashboard/recent-ticket-item";
import { RecentCustomerItem } from "@/src/components/screens/dashboard/recent-customer-item";
import { DashboardSkeletonLoading } from "@/src/components/screens/dashboard/skeleton-loading";

import { TenantDashboardData } from "@/src/features/dashboard/types";
import { useTenantDashboard } from "@/src/features/dashboard/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";

export default function TenantOwnerDashboard() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  const colors = useThemeColor();

  const { data: response, isLoading, refetch, isRefetching } = useTenantDashboard();
  const data = response?.data as TenantDashboardData | undefined;
  const isRefreshing = isRefetching;

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <ScreenWrapper
        headerTitle={t("dashboard.title")}
        showAvatar={true}
        showNotification={true}
        isLoading={true}
      >
        <DashboardSkeletonLoading />
      </ScreenWrapper>
    );
  }

  if (!data) {
    return (
      <ScreenWrapper headerTitle={t("dashboard.title")}>
        <EmptyState
          icon="analytics-outline"
          title={t("dashboard.emptyTitle")}
          description={t("dashboard.emptyDesc")}
        />
      </ScreenWrapper>
    );
  }

  const percentage =
    data.metrics.total_customers > 0
      ? Math.round((data.metrics.active_services / data.metrics.total_customers) * 100)
      : 0;

  const urgentCount = data.recent_tickets.filter((item) => item.priority === "URGENT").length;

  const quickActions = [
    {
      key: "services",
      icon: "wifi-outline" as const,
      label: t("tenantDashboard.services"),
      route: "/service" as const,
    },
    {
      key: "customers",
      icon: "people-outline" as const,
      label: t("tenantDashboard.customers"),
      route: "/customer" as const,
    },
    {
      key: "tickets",
      icon: "ticket-outline" as const,
      label: t("tenantDashboard.tickets"),
      route: "/ticket" as const,
    },
    {
      key: "allMenu",
      icon: "grid-outline" as const,
      label: t("tenantDashboard.allMenu"),
      route: "/all-menu" as const,
    },
  ];

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
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <HeroStatCard
          label={t("tenantDashboard.activeServices")}
          value={data.metrics.active_services}
          total={data.metrics.total_customers}
          onlineLabel={`${percentage}% Online`}
        />

        <View className="flex-row gap-3 mb-5">
          <SubStatCard
            label={t("tenantDashboard.openTickets")}
            value={data.metrics.open_tickets}
            dotColor={colors.error}
            hint={urgentCount > 0 ? `${urgentCount} urgent` : undefined}
          />
          <SubStatCard
            label={t("tenantDashboard.totalPackages")}
            value={data.metrics.total_packages}
            dotColor={colors.primary}
          />
        </View>

        <View className="flex-row gap-2.5 mb-6">
          {quickActions.map((action) => (
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

        {data.recent_tickets.length > 0 && (
          <GroupedSection
            title={t("tenantDashboard.recentTickets")}
            onAction={() => router.push("/ticket")}
          >
            {data.recent_tickets.map((ticket, idx) => (
              <RecentTicketItem
                key={ticket.id}
                item={ticket}
                isLast={idx === data.recent_tickets.length - 1}
              />
            ))}
          </GroupedSection>
        )}

        {data.recent_customers.length > 0 && (
          <GroupedSection
            title={t("tenantDashboard.recentCustomers")}
            onAction={() => router.push("/customer")}
          >
            {data.recent_customers.map((customer, idx) => (
              <RecentCustomerItem
                key={customer.id}
                item={customer}
                isLast={idx === data.recent_customers.length - 1}
              />
            ))}
          </GroupedSection>
        )}

        {data.recent_tickets.length === 0 && data.recent_customers.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title={t("dashboard.emptyTitle")}
            description={t("dashboard.emptyDesc")}
          />
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}
