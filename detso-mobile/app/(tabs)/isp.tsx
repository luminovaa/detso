import React from "react";
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

import { useInfiniteTenants } from "@/src/features/tenant/hooks";
import { useT } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";
import { ISPSkeletonLoading } from "@/src/components/screens/isp/skeleton-loading";
import { ISPItem } from "@/src/components/screens/isp/isp-item";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

import { COLORS } from '@/src/lib/colors';
export default function IspScreen() {
  const { t } = useT();
  const { contentPaddingBottom, fabBottom } = useTabBarHeight();

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch, 
    isRefetching 
  } = useInfiniteTenants({ limit: 10 });

  // Flatten semua pages jadi satu array
  const tenants: Tenant[] = data?.pages.flatMap((page: any) => page?.data?.tenants || []) ?? [];

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
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
              refreshing={isRefetching && !isFetchingNextPage} 
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
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color={COLORS.brand.primary} />
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
