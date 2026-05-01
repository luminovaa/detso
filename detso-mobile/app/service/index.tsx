import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import _debounce from "lodash.debounce";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { SearchBar } from "@/src/components/global/search-bar";

import { useInfiniteCustomers } from "@/src/features/customer/hooks";
import { useDeleteServiceConnection } from "@/src/features/connection-service/hooks";
import { useT } from "@/src/features/i18n/store";
import { ServiceItem } from "@/src/components/screens/service/service-item";
import { ServiceSkeletonLoading } from "@/src/components/screens/service/skeleton-loading";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { ServiceConnection } from "@/src/lib/types";

export default function ServiceScreen() {
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const fabBottom = safeBottom + 24;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteCustomers({
    limit: 10,
    search: debouncedSearch || undefined,
  });

  // Flatten all pages — GET /customer returns services[]
  const services: ServiceConnection[] =
    data?.pages.flatMap((page: any) => page?.data?.services || []) ?? [];

  const deleteService = useDeleteServiceConnection();

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchHandler = useCallback(
    _debounce((text: string) => {
      setDebouncedSearch(text);
    }, 500),
    [],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearchHandler(text);
  };

  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteService.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  return (
    <ScreenWrapper headerTitle={t("service.title")} showBackButton isLoading={isLoading}>
      {/* Search Bar */}
      <View className="pt-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t("service.searchPlaceholder")}
          onClear={() => {
            setSearchQuery("");
            setDebouncedSearch("");
          }}
        />
      </View>

      {isLoading ? (
        <ServiceSkeletonLoading />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceItem
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
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="wifi-outline"
              title={t("service.emptyTitle")}
              description={t("service.emptyDesc")}
              actionLabel={t("service.refresh")}
              onAction={handleRefresh}
              isLoading={isRefetching}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="hsl(var(--primary))" />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/service/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
