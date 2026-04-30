import React, { useState } from "react";
import { 
  View, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";

import { useTenants } from "@/src/features/tenant/hooks";
import { useT } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";
import { ISPSkeletonLoading } from "@/src/components/screens/isp/skeleteon-loading";
import { ISPItem } from "@/src/components/screens/isp/isp-item";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

export default function IspScreen() {
  const { t } = useT();
  const { contentPaddingBottom, fabBottom } = useTabBarHeight();

  const [page, setPage] = useState(1);
  const { data: response, isLoading, refetch, isRefetching } = useTenants({ page, limit: 10 });
  const tenants: Tenant[] = response?.data?.tenants || [];
  const hasMore = response?.data?.pagination?.hasNextPage || false;
  const isRefreshing = isRefetching;

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };


  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  return (
    <ScreenWrapper 
      headerTitle={t("isp.title")}
      isLoading={isLoading}
    >
      {isLoading ? (
        <ISPSkeletonLoading />
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ISPItem item={item} />}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentPaddingBottom }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh} 
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <EmptyState 
              icon="business-outline"
              title={t("isp.emptyTitle")}
              description={t("isp.emptyDesc")}
              actionLabel={t("isp.refresh")}
              onAction={handleRefresh}
              isLoading={isRefreshing}
            />
          }
          ListFooterComponent={
            hasMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="hsl(var(--primary))" />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB untuk tambah ISP */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push("/isp/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}