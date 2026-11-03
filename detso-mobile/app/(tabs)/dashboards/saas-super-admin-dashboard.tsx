import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { Text } from "@/src/components/global/text";

import { HeroStatCard } from "@/src/components/screens/dashboard/hero-stat-card";
import { SubStatCard } from "@/src/components/screens/dashboard/sub-stat-card";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
import { RecentTenantItem } from "@/src/components/screens/dashboard/recent-tenant-item";
import { DashboardSkeletonLoading } from "@/src/components/screens/dashboard/skeleton-loading";
import { TenantMapView } from "@/src/components/screens/dashboard/tenant-map-view";

import { SaasDashboardData } from "@/src/features/dashboard/types";
import { useSaasDashboard } from "@/src/features/dashboard/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";

export default function SaasSuperAdminDashboard() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  const colors = useThemeColor();

  const { data: response, isLoading, refetch, isRefetching } = useSaasDashboard();
  const data = response?.data as SaasDashboardData | undefined;
  const isRefreshing = isRefetching;

  const [isMapTouched, setIsMapTouched] = useState(false);

  const handleMapTouchStart = useCallback(() => setIsMapTouched(true), []);
  const handleMapTouchEnd = useCallback(() => setIsMapTouched(false), []);

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

  const pct =
    data.metrics.total_tenants > 0
      ? Math.round((data.metrics.active_tenants / data.metrics.total_tenants) * 100)
      : 0;

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
    >
      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isMapTouched}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <HeroStatCard
              label={t("dashboard.activeTenants")}
              value={data.metrics.active_tenants}
              total={data.metrics.total_tenants}
              onlineLabel={`${pct}%`}
            />

            <View className="flex-row gap-3 mb-5">
              <SubStatCard
                label={t("dashboard.inactiveTenants")}
                value={data.metrics.inactive_tenants}
                dotColor={colors.error}
              />
              <SubStatCard
                label={t("dashboard.totalCustomers")}
                value={data.metrics.total_customers}
                dotColor={colors.primary}
              />
            </View>

            {data.recent_activities.length > 0 ? (
              <GroupedSection title={t("dashboard.recentActivities")}>
                {data.recent_activities.map((item, idx) => (
                  <RecentTenantItem
                    key={item.id}
                    item={item}
                    isLast={idx === data.recent_activities.length - 1}
                  />
                ))}
              </GroupedSection>
            ) : (
              <View className="mb-6">
                <Text weight="bold" className="text-lg text-foreground mb-2.5">
                  {t("dashboard.recentActivities")}
                </Text>
                <EmptyState
                  icon="business-outline"
                  title={t("dashboard.emptyTitle")}
                  description={t("dashboard.emptyDesc")}
                />
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          <TenantMapView
            data={data.map_data}
            onMapTouchStart={handleMapTouchStart}
            onMapTouchEnd={handleMapTouchEnd}
          />
        }
      />
    </ScreenWrapper>
  );
}
