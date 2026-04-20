import React, { useState,  useEffect } from "react";
import { 
  View, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Header } from "@/src/components/global/header";
import { EmptyState } from "@/src/components/global/empty-state";

import { tenantService } from "@/src/features/tenant/service";
import { useT } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";
import { ISPSkeletonLoading } from "@/src/components/screens/isp/skeleteon-loading";
import { ISPItem } from "@/src/components/screens/isp/isp-item";

export default function IspScreen() {
  const { t } = useT();
  
  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchTenants = async (pageToFetch: number, refresh = false) => {
    try {
      const response = await tenantService.getAll({
        page: pageToFetch,
        limit: 10,
      });

      // Sesuaikan dengan struktur response backend: response.data.tenants
      const newTenants = response.data.tenants || [];
      const pagination = response.data.pagination;

      if (refresh) {
        setTenants(newTenants);
      } else {
        setTenants((prev) => [...prev, ...newTenants]);
      }

      // Gunakan hasNextPage dari pagination backend
      setHasMore(pagination?.hasNextPage || false);
      
    } catch (error) {
      console.error("Fetch tenants error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTenants(1, true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchTenants(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTenants(nextPage);
    }
  };


  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  return (
    <ScreenWrapper>
      <Header title={t("isp.title")} />
      
      {isLoading && page === 1 ? (
        <ISPSkeletonLoading />
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ISPItem item={item} />}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
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
            isLoadingMore ? (
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
        className="absolute bottom-28 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
