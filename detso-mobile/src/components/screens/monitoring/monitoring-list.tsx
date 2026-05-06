import React from "react";
import { View, ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { useRouters } from "@/src/features/mikrotik/hooks";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { MikrotikRouter } from "@/src/features/mikrotik/schema";
import { useThemeColor } from "@/src/lib/theme-colors";

function RouterCard({ item }: { item: MikrotikRouter }) {
  const { t } = useT();
  const colors = useThemeColor();

  return (
    <Pressable
      onPress={() => router.push(`/monitoring/${item.id}`)}
      className="bg-card border border-border rounded-xl p-4 mb-3 active:opacity-70"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className={`w-3 h-3 rounded-full mr-2 ${item.is_online ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text weight="semibold" className="text-base text-foreground flex-1" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.icon} />
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="globe-outline" size={14} color={colors.icon} />
        <Text className="text-sm text-muted-foreground ml-1">
          {item.host}:{item.api_port}
        </Text>
      </View>

      {item.board_name && (
        <View className="flex-row items-center mb-1">
          <Ionicons name="hardware-chip-outline" size={14} color={colors.icon} />
          <Text className="text-sm text-muted-foreground ml-1">
            {item.board_name}
          </Text>
        </View>
      )}

      {item.routeros_version && (
        <View className="flex-row items-center mb-1">
          <Ionicons name="code-outline" size={14} color={colors.icon} />
          <Text className="text-sm text-muted-foreground ml-1">
            RouterOS {item.routeros_version}
          </Text>
        </View>
      )}

      <View className="flex-row items-center mt-2">
        <View className={`px-2 py-0.5 rounded-full ${item.is_online ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
          <Text className={`text-xs ${item.is_online ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {item.is_online ? t("monitoring.online") : t("monitoring.offline")}
          </Text>
        </View>
        {item.last_seen_at && (
          <Text className="text-xs text-muted-foreground ml-2">
            {t("monitoring.lastSeen")}: {new Date(item.last_seen_at).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function MonitoringList() {
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const { data, isLoading, refetch, isRefetching } = useRouters();

  const routers: MikrotikRouter[] = data?.data || [];

  return (
    <ScreenWrapper
      headerTitle={t("monitoring.title")}
      showBackButton={true}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="mt-4">
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
            </View>
          ) : routers.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="hardware-chip-outline" size={48} color={colors.icon} />
              <Text weight="semibold" className="text-lg text-foreground mt-4">
                {t("monitoring.emptyTitle")}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1 text-center">
                {t("monitoring.emptyDesc")}
              </Text>
            </View>
          ) : (
            routers.map((item) => (
              <RouterCard key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
