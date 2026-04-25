import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useColorScheme } from "nativewind";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { Text } from "@/src/components/global/text";

import { MetricCard } from "@/src/components/screens/dashboard/metric-card";
import { RecentTenantItem } from "@/src/components/screens/dashboard/recent-tenant-item";
import { DashboardSkeletonLoading } from "@/src/components/screens/dashboard/skeleton-loading";
import { TenantMapView } from "@/src/components/screens/dashboard/tenant-map-view";

import { dashboardService } from "@/src/features/dashboard/service";
import { SaasDashboardData } from "@/src/features/dashboard/types";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { showErrorToast } from "@/src/lib/api-error";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

export default function SaasSuperAdminDashboard() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  const [data, setData] = useState<SaasDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMapTouched, setIsMapTouched] = useState(false);

  const handleMapTouchStart = useCallback(() => setIsMapTouched(true), []);
  const handleMapTouchEnd = useCallback(() => setIsMapTouched(false), []);

  const fetchDashboardData = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        // Untuk refresh, kita tetap set isLoading agar skeleton muncul
        setIsLoading(true);
      } else {
        setIsLoading(true);
      }

      const response = await dashboardService.getSaasData();
      setData(response.data);
    } catch (error) {
      showErrorToast(error, "Gagal Memuat Dashboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
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

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
    >
      <FlatList
        data={data.recent_activities}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isMapTouched}
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
            <View className="flex-row gap-3 mb-3">
              <MetricCard
                icon="business"
                label={t("dashboard.totalTenants")}
                value={data.metrics.total_tenants}
                color={primaryColor}
              />
              <MetricCard
                icon="checkmark-circle"
                label={t("dashboard.activeTenants")}
                value={data.metrics.active_tenants}
                color={primaryColor}
              />
            </View>

            <View className="flex-row gap-3 mb-6">
              <MetricCard
                icon="close-circle"
                label={t("dashboard.inactiveTenants")}
                value={data.metrics.inactive_tenants}
                color={primaryColor}
              />
              <MetricCard
                icon="people"
                label={t("dashboard.totalCustomers")}
                value={data.metrics.total_customers}
                color={primaryColor}
              />
            </View>

            <Text weight="bold" className="text-xl text-foreground mb-3">
              {t("dashboard.recentActivities")}
            </Text>
          </View>
        }
        renderItem={({ item }) => <RecentTenantItem item={item} />}
        ListFooterComponent={
          <TenantMapView
            data={data.map_data}
            onMapTouchStart={handleMapTouchStart}
            onMapTouchEnd={handleMapTouchEnd}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title={t("dashboard.emptyTitle")}
            description={t("dashboard.emptyDesc")}
          />
        }
      />
    </ScreenWrapper>
  );
}
