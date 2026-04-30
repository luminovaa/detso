import React from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useColorScheme } from "nativewind";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { Text } from "@/src/components/global/text";

import { MetricCard } from "@/src/components/screens/dashboard/metric-card";
import { RecentTicketItem } from "@/src/components/screens/dashboard/recent-ticket-item";
import { RecentCustomerItem } from "@/src/components/screens/dashboard/recent-customer-item";
import { DashboardSkeletonLoading } from "@/src/components/screens/dashboard/skeleton-loading";
import { QuickMenuCard } from "@/src/components/screens/dashboard/quick-menu-card";

import { TenantDashboardData } from "@/src/features/dashboard/types";
import { useTenantDashboard } from "@/src/features/dashboard/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { router } from "expo-router";

export default function TenantOwnerDashboard() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

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
          actionLabel={t("dashboard.refresh")}
          onAction={handleRefresh}
          isLoading={isRefreshing}
        />
      </ScreenWrapper>
    );
  }

  // Combine tickets and customers for FlatList
  const combinedData = [
    ...data.recent_tickets.map(item => ({ type: 'ticket' as const, data: item })),
    ...data.recent_customers.map(item => ({ type: 'customer' as const, data: item })),
  ];

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
    >
      <FlatList
        data={combinedData}
        keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
        ListHeaderComponent={
          <View className="mb-6">
            {/* Metrics Grid - Row 1 */}
            <View className="flex-row gap-3 mb-3">
              <MetricCard
                icon="people"
                label={t("tenantDashboard.totalCustomers")}
                value={data.metrics.total_customers}
                color={primaryColor}
              />
              <MetricCard
                icon="wifi"
                label={t("tenantDashboard.activeServices")}
                value={data.metrics.active_services}
                color={primaryColor}
              />
            </View>

            {/* Metrics Grid - Row 2 */}
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                icon="alert-circle"
                label={t("tenantDashboard.openTickets")}
                value={data.metrics.open_tickets}
                color={primaryColor}
              />
              <MetricCard
                icon="pricetag"
                label={t("tenantDashboard.totalPackages")}
                value={data.metrics.total_packages}
                color={primaryColor}
              />
            </View>

            {/* Quick Menu Section */}
            <View className="mb-6">
              <Text weight="bold" className="text-xl text-foreground mb-3">
                {t("tenantDashboard.quickMenu")}
              </Text>
              <View className="flex-row gap-3 mb-3">
                <QuickMenuCard
                  icon="wifi"
                  label={t("tenantDashboard.services")}
                  onPress={() => console.log("Navigate to Services")}
                />
                <QuickMenuCard
                  icon="people"
                  label={t("tenantDashboard.customers")}
                  onPress={() => console.log("Navigate to Customers")}
                />
                <QuickMenuCard
                  icon="pricetag"
                  label={t("tenantDashboard.packages")}
                  onPress={() => router.push("/package")}
                />
              </View>
              <View className="flex-row gap-3">
                <QuickMenuCard
                  icon="document-text"
                  label={t("tenantDashboard.tickets")}
                  onPress={() => console.log("Navigate to Tickets")}
                />
                <QuickMenuCard
                  icon="person"
                  label={t("tenantDashboard.users")}
                  onPress={() => console.log("Navigate to Users")}
                />
                <QuickMenuCard
                  icon="apps"
                  label={t("tenantDashboard.allMenu")}
                  onPress={() => console.log("Navigate to All Menu")}
                />
              </View>
            </View>

            {/* Recent Tickets Section */}
            {data.recent_tickets.length > 0 && (
              <>
                <Text weight="bold" className="text-xl text-foreground mb-3">
                  {t("tenantDashboard.recentTickets")}
                </Text>
                {data.recent_tickets.map((ticket) => (
                  <RecentTicketItem key={ticket.id} item={ticket} />
                ))}
              </>
            )}

            {/* Recent Customers Section */}
            {data.recent_customers.length > 0 && (
              <>
                <Text weight="bold" className="text-xl text-foreground mb-3 mt-4">
                  {t("tenantDashboard.recentCustomers")}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'customer') {
            return <RecentCustomerItem item={item.data} />;
          }
          return null;
        }}
        ListEmptyComponent={
          data.recent_tickets.length === 0 && data.recent_customers.length === 0 ? (
            <EmptyState
              icon="document-outline"
              title={t("dashboard.emptyTitle")}
              description={t("dashboard.emptyDesc")}
            />
          ) : null
        }
      />
    </ScreenWrapper>
  );
}
