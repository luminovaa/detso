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
import { Badge } from "@/src/components/global/badge";

import { useInfiniteTickets, useDeleteTicket } from "@/src/features/ticket/hooks";
import { useT } from "@/src/features/i18n/store";
import { TicketItem } from "@/src/components/screens/ticket/ticket-item";
import { TicketSkeletonLoading } from "@/src/components/screens/ticket/skeleton-loading";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useDebounceSearch } from "@/src/hooks/use-debounce-search";
import { Ticket, TicketPriority } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";

const PRIORITY_OPTIONS: { value: TicketPriority | undefined; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: undefined, labelKey: "ticket.allPriorities", variant: "neutral" },
  { value: "URGENT", labelKey: "ticket.priorityUrgent", variant: "error" },
  { value: "HIGH", labelKey: "ticket.priorityHigh", variant: "warning" },
  { value: "MEDIUM", labelKey: "ticket.priorityMedium", variant: "info" },
  { value: "LOW", labelKey: "ticket.priorityLow", variant: "neutral" },
];

export default function TicketScreen() {
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const fabBottom = safeBottom + 24;

  // State
  const { searchQuery, debouncedSearch, handleSearchChange, clearSearch } = useDebounceSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | undefined>(undefined);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteTickets({
    limit: 10,
    search: debouncedSearch || undefined,
    priority: priorityFilter,
  });

  // Flatten all pages
  const tickets: Ticket[] = useMemo(
    () => data?.pages.flatMap((page: any) => page?.data?.tickets || []) ?? [],
    [data?.pages],
  );

  const deleteTicket = useDeleteTicket();

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
    deleteTicket.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }, [deleteTicket]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryColor = "hsl(var(--primary))";

  return (
    <ScreenWrapper headerTitle={t("ticket.title")} showBackButton isLoading={isLoading}>
      {/* Search Bar */}
      <View className="pt-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t("ticket.searchPlaceholder")}
          onClear={clearSearch}
        />
      </View>

      {/* Priority Filter Pills */}
      <View className="flex-row gap-x-2 pb-3 px-1">
        {PRIORITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.labelKey}
            activeOpacity={0.7}
            onPress={() => setPriorityFilter(option.value)}
          >
            <Badge
              colorVariant={priorityFilter === option.value ? option.variant : "neutral"}
              className={`px-3.5 py-1 ${priorityFilter === option.value ? "opacity-100" : "opacity-50"}`}
            >
              {t(option.labelKey)}
            </Badge>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <TicketSkeletonLoading />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketItem
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
              icon="document-text-outline"
              title={t("ticket.emptyTitle")}
              description={t("ticket.emptyDesc")}
              actionLabel={t("ticket.refresh")}
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

      {/* FAB to create ticket */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/ticket/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
