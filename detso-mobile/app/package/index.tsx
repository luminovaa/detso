import React, { useState, useCallback, useEffect } from "react";
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

import { usePackages, useDeletePackage } from "@/src/features/package/hooks";
import { useT } from "@/src/features/i18n/store";
import { PackageSkeletonLoading } from "@/src/components/screens/package/skeleton-loading";
import { PackageItem } from "@/src/components/screens/package/package-item";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { Package } from "@/src/lib/types";

export default function PackageScreen() {
  const { t } = useT();
  const { contentPaddingBottom, fabBottom } = useTabBarHeight();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: response, isLoading, refetch, isRefetching } = usePackages({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });
  const packages: Package[] = response?.data?.packages || [];
  const hasMore = response?.data?.pagination?.hasNextPage || false;
  const isRefreshing = isRefetching;

  const deletePackage = useDeletePackage();

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deletePackage.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
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
            hasMore ? (
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
