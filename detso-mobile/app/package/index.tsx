/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
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
import _debounce from "lodash.debounce";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { SearchBar } from "@/src/components/global/search-bar";

import { packageService } from "@/src/features/package/service";
import { useT } from "@/src/features/i18n/store";
import { PackageSkeletonLoading } from "@/src/components/screens/package/skeleton-loading";
import { PackageItem } from "@/src/components/screens/package/package-item";
import { showErrorToast } from "@/src/lib/api-error";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { showToast } from "@/src/components/global/toast";
import { Package } from "@/src/lib/types";

export default function PackageScreen() {
  const { t } = useT();
  const { contentPaddingBottom, fabBottom } = useTabBarHeight();
  
  // State
  const [packages, setPackages] = useState<Package[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounced search
  const debouncedSearchHandler = useCallback(
    _debounce((text: string) => {
      setDebouncedSearch(text);
      setPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearchHandler(text);
  };

  const fetchPackages = async (pageToFetch: number, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setIsLoading(true);
      }

      const response = await packageService.getAll({
        page: pageToFetch,
        limit: 10,
        search: debouncedSearch || undefined,
      });

      const newPackages = response.data.packages || [];
      const pagination = response.data.pagination;

      if (refresh) {
        setPackages(newPackages);
      } else {
        setPackages((prev) => [...prev, ...newPackages]);
      }

      setHasMore(pagination?.hasNextPage || false);
      
    } catch (error) {
      showErrorToast(error, t("common.loadFailed"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPackages(1, true);
  }, [debouncedSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchPackages(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPackages(nextPage);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await packageService.delete(id);
      showToast.success(t("common.success"), t("package.successDelete"));
      fetchPackages(1, true);
    } catch (error) {
      showErrorToast(error, t("common.failed"));
    } finally {
      setDeletingId(null);
    }
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  return (
    <ScreenWrapper 
      headerTitle={t("package.title")}
      isLoading={isLoading}
    >
      {/* Search Bar */}
      <View className="pt-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t("package.searchPlaceholder")}
          onClear={() => {
            setSearchQuery("");
            setDebouncedSearch("");
            setPage(1);
          }}
        />
      </View>

      {isLoading ? (
        <PackageSkeletonLoading />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PackageItem 
              item={item} 
              searchQuery={debouncedSearch}
              onDelete={handleDelete}
              isDeleting={deletingId === item.id}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: contentPaddingBottom }}
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
              icon="cube-outline"
              title={t("package.emptyTitle")}
              description={t("package.emptyDesc")}
              actionLabel={t("package.refresh")}
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

      {/* FAB untuk tambah Package */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push("/package/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
