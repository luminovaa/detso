import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { EmptyState } from "@/src/components/global/empty-state";
import { SearchBar } from "@/src/components/global/search-bar";

// --- State & Logic ---
import { useNetworkNodes, useDeleteNode } from "@/src/features/network/hooks";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useDebounceSearch } from "@/src/hooks/use-debounce-search";
import { NetworkNode } from "@/src/features/network/types";
import { COLORS } from "@/src/lib/colors";

export default function OdpListScreen() {
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const fabBottom = safeBottom + 24;

  // State
  const { searchQuery, debouncedSearch, handleSearchChange, clearSearch } = useDebounceSearch();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useNetworkNodes("ODP");
  const deleteNode = useDeleteNode();

  // Flatten nodes from response
  const nodes: NetworkNode[] = useMemo(() => {
    const allNodes = data?.data?.nodes || [];
    if (!debouncedSearch) return allNodes;
    const search = debouncedSearch.toLowerCase();
    return allNodes.filter(
      (node: NetworkNode) =>
        node.name.toLowerCase().includes(search) ||
        (node.address && node.address.toLowerCase().includes(search))
    );
  }, [data?.data?.nodes, debouncedSearch]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(
    (node: NetworkNode) => {
      Alert.alert(
        t("odp.deleteConfirm"),
        t("odp.deleteMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("odp.deleteBtn"),
            style: "destructive",
            onPress: () => {
              setDeletingId(node.id);
              deleteNode.mutate(node.id, {
                onSettled: () => setDeletingId(null),
              });
            },
          },
        ]
      );
    },
    [deleteNode, t]
  );

  const primaryColor = COLORS.brand.primary;

  const renderItem = useCallback(
    ({ item }: { item: NetworkNode }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/odp/${item.id}`)}
        onLongPress={() => handleDelete(item)}
        className="mx-4 mb-3 p-4 bg-card rounded-2xl border border-border/50"
        style={{ opacity: deletingId === item.id ? 0.5 : 1 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text weight="semibold" className="text-base text-foreground">
              {item.name}
            </Text>
            {item.address && (
              <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
                {item.address}
              </Text>
            )}
          </View>
          <View className="items-end">
            {item.slot && (
              <View className="flex-row items-center bg-primary/10 px-2.5 py-1 rounded-full">
                <Ionicons name="git-branch-outline" size={14} color={primaryColor} />
                <Text weight="semibold" className="text-xs text-primary ml-1">
                  {item.used_slot || 0}/{item.slot}
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.parent_name && (
          <View className="flex-row items-center mt-2 pt-2 border-t border-border/30">
            <Ionicons name="server-outline" size={14} color={COLORS.neutral.gray[500]} />
            <Text className="text-xs text-muted-foreground ml-1.5">
              {item.parent_name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [deletingId, handleDelete, primaryColor]
  );

  return (
    <ScreenWrapper headerTitle={t("odp.title")} showBackButton isLoading={isLoading}>
      {/* Search Bar */}
      <View className="pt-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t("odp.searchPlaceholder")}
          onClear={clearSearch}
        />
      </View>

      <FlatList
        data={nodes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="git-network-outline"
              title={t("odp.emptyTitle")}
              description={t("odp.emptyDesc")}
              actionLabel={t("common.refresh")}
              onAction={handleRefresh}
              isLoading={isRefetching}
            />
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/odp/create")}
        className="absolute right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 elevation-5"
        style={{ bottom: fabBottom }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
