import React from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { EmptyState } from "@/src/components/global/empty-state";
import { usePPPoESessions } from "@/src/features/mikrotik/hooks";
import { PPPoESessionData, PPPoESessionsResponse } from "@/src/features/mikrotik/schema";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";

interface Props {
  routerId: string;
}

function SessionCard({ session }: { session: PPPoESessionData }) {
  const { t } = useT();
  const colors = useThemeColor();

  return (
    <View className="bg-card border border-border rounded-xl p-3 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          <View className="w-2 h-2 rounded-full mr-2 bg-green-500" />
          <Text weight="semibold" className="text-sm text-foreground flex-1" numberOfLines={1}>
            {session.name}
          </Text>
        </View>
        {session.uptime && (
          <Text className="text-xs text-muted-foreground">
            {t("monitoring.uptime")}: {session.uptime}
          </Text>
        )}
      </View>
      <View className="flex-row items-center">
        <Ionicons name="globe-outline" size={12} color={colors.icon} />
        <Text className="text-xs text-muted-foreground ml-1">
          {session.address ?? "-"}
        </Text>
        {session.caller_id && (
          <>
            <Ionicons
              name="hardware-chip-outline"
              size={12}
              color={colors.icon}
              style={{ marginLeft: 8 }}
            />
            <Text className="text-xs text-muted-foreground ml-1">{session.caller_id}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export function PPPoESessions({ routerId }: Props) {
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const { data, isLoading, isError, refetch, isRefetching } = usePPPoESessions(routerId);

  const payload: PPPoESessionsResponse | undefined = data?.data;
  const sessions = payload?.sessions ?? [];

  return (
    <ScreenWrapper headerTitle={t("monitoring.pppoeTitle")} showBackButton={true}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View className="mt-4 flex-1">
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
            </View>
          ) : isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t("monitoring.pppoeError")}
              description={t("monitoring.pppoeErrorDesc")}
              actionLabel={t("monitoring.retry")}
              onAction={() => refetch()}
              isLoading={isRefetching}
            />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title={t("monitoring.pppoeEmpty")}
              description={t("monitoring.pppoeEmptyDesc")}
            />
          ) : (
            sessions.map((session) => (
              <SessionCard key={session.id || session.name} session={session} />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
