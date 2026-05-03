import React, { useState, useCallback, useMemo } from "react";
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

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { EmptyState } from "@/src/components/global/empty-state";
import { SearchBar } from "@/src/components/global/search-bar";

import { useInfiniteUsers, useDeleteUser } from "@/src/features/user/hooks";
import { useT } from "@/src/features/i18n/store";
import { TeamItem } from "@/src/components/screens/team/team-item";
import { TeamSkeletonLoading } from "@/src/components/screens/team/skeleton-loading";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useDebounceSearch } from "@/src/hooks/use-debounce-search";
import { TeamMember } from "@/src/lib/types";

import { COLORS } from '@/src/lib/colors';
export default function TeamScreen() {
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();
  const { bottom: safeBottom } = useSafeAreaInsets();

  // FAB position for stack screen (no tab bar)
  const fabBottom = safeBottom + 24;

  // State
  const { searchQuery, debouncedSearch, handleSearchChange, clearSearch } = useDebounceSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteUsers({
    limit: 10,
    search: debouncedSearch || undefined,
  });

  // Flatten all pages into one array
  const members: TeamMember[] = useMemo(
    () => data?.pages.flatMap((page: any) => page?.data?.users || []) ?? [],
    [data?.pages],
  );

  const deleteUser = useDeleteUser();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
    deleteUser.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }, [deleteUser]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = COLORS.brand.primary;

  return (
    <ScreenWrapper headerTitle={t("team.title")} showBackButton isLoading={isLoading}>
      {/* Search Bar */}
      <View className="pt-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t("team.searchPlaceholder")}
          onClear={clearSearch}
        />
      </View>

      {isLoading ? (
        <TeamSkeletonLoading />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TeamItem
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
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
              icon="people-outline"
              title={t("team.emptyTitle")}
              description={t("team.emptyDesc")}
              actionLabel={t("team.refresh")}
              onAction={handleRefresh}
              isLoading={isRefetching}
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

      {/* FAB to add member */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/team/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
