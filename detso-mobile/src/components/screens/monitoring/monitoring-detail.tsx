import React from "react";
import { View, ScrollView, RefreshControl, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { useCurrentMonitoring, useForcePoll } from "@/src/features/mikrotik/hooks";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";
import { safeNumber, formatBytes, formatBps, formatTemperature } from "@/src/lib/format";

interface Props {
  routerId: string;
}

function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View className="h-2.5 bg-muted rounded-full overflow-hidden mt-1">
      <View className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
    </View>
  );
}

function StatCard({ icon, label, value, subValue, color }: {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) {
  const colors = useThemeColor();
  return (
    <View className="bg-card border border-border rounded-xl p-3 flex-1">
      <View className="flex-row items-center mb-1">
        <Ionicons name={icon as any} size={16} color={color || colors.icon} />
        <Text className="text-xs text-muted-foreground ml-1">{label}</Text>
      </View>
      <Text weight="bold" className="text-lg text-foreground">{value}</Text>
      {subValue && <Text className="text-xs text-muted-foreground">{subValue}</Text>}
    </View>
  );
}

export function MonitoringDetail({ routerId }: Props) {
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const { data, isLoading, refetch, isRefetching } = useCurrentMonitoring(routerId);
  const forcePoll = useForcePoll();

  const monitoringResponse = data?.data;
  const routerInfo = monitoringResponse?.router;
  const monitoring = monitoringResponse?.monitoring;
  const interfaces = monitoringResponse?.interfaces || [];

  const cpuLoad = safeNumber(monitoring?.cpu_load);
  const memoryUsed = safeNumber(monitoring?.memory_used);
  const memoryTotal = safeNumber(monitoring?.memory_total);
  const memoryPercent = memoryTotal > 0 ? Math.round((memoryUsed / memoryTotal) * 100) : 0;
  const activeSessions = safeNumber(monitoring?.active_sessions);
  const diskUsed = safeNumber(monitoring?.disk_used);
  const diskTotal = safeNumber(monitoring?.disk_total);
  const diskPercent = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;
  const temperature = monitoring?.temperature ?? null;

  const handleRefresh = () => {
    forcePoll.mutate(routerId, { onSettled: () => refetch() });
  };

  return (
    <ScreenWrapper
      headerTitle={routerInfo?.name || t("monitoring.detailTitle")}
      showBackButton={true}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
          </View>
        ) : !monitoring ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="cloud-offline-outline" size={48} color={colors.icon} />
            <Text weight="semibold" className="text-lg text-foreground mt-4">
              {t("monitoring.noData")}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1 text-center">
              {t("monitoring.noDataDesc")}
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {/* Status Header */}
            <View className="bg-card border border-border rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full mr-2 ${routerInfo?.is_online ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Text weight="semibold" className="text-base text-foreground">
                    {routerInfo?.is_online ? t("monitoring.online") : t("monitoring.offline")}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground">
                  {t("monitoring.uptime")}: {monitoring.uptime ?? '-'}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-3 mb-4">
              <StatCard
                icon="speedometer-outline"
                label="CPU"
                value={`${cpuLoad.toFixed(0)}%`}
                color={cpuLoad > 80 ? colors.error : cpuLoad > 50 ? colors.warning : colors.success}
              />
              <StatCard
                icon="people-outline"
                label={t("monitoring.sessions")}
                value={`${activeSessions}`}
                color={colors.info}
              />
              <StatCard
                icon="thermometer-outline"
                label={t("monitoring.temperature")}
                value={formatTemperature(temperature)}
                color={
                  temperature == null
                    ? undefined
                    : temperature > 75
                      ? colors.error
                      : temperature > 60
                        ? colors.warning
                        : colors.success
                }
              />
            </View>

            {/* PPPoE & History navigation */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push(`/monitoring/${routerId}/pppoe`)}
                className="bg-card border border-border rounded-xl p-3 flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="people-outline" size={18} color={colors.info} />
                    <Text
                      weight="semibold"
                      className="text-sm text-foreground ml-2"
                      numberOfLines={1}
                    >
                      {t("monitoring.pppoeTitle")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {t("monitoring.sessions")}: {activeSessions}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/monitoring/${routerId}/history`)}
                className="bg-card border border-border rounded-xl p-3 flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="stats-chart-outline" size={18} color={colors.warning} />
                    <Text
                      weight="semibold"
                      className="text-sm text-foreground ml-2"
                      numberOfLines={1}
                    >
                      {t("monitoring.historyTitle")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {t("monitoring.historyDesc")}
                </Text>
              </Pressable>
            </View>

            {/* CPU Load */}
            <View className="bg-card border border-border rounded-xl p-4 mb-4">
              <Text weight="semibold" className="text-sm text-foreground mb-2">
                CPU Load
              </Text>
              <View className="flex-row items-center justify-between">
                <Text weight="bold" className="text-2xl text-foreground">
                  {cpuLoad.toFixed(1)}%
                </Text>
              </View>
              <ProgressBar
                value={cpuLoad}
                max={100}
                color={cpuLoad > 80 ? "bg-red-500" : cpuLoad > 50 ? "bg-yellow-500" : "bg-green-500"}
              />
            </View>

            {/* Memory */}
            <View className="bg-card border border-border rounded-xl p-4 mb-4">
              <Text weight="semibold" className="text-sm text-foreground mb-2">
                Memory
              </Text>
              <View className="flex-row items-center justify-between">
                <Text weight="bold" className="text-2xl text-foreground">
                  {memoryPercent}%
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatBytes(memoryUsed)} / {formatBytes(memoryTotal)}
                </Text>
              </View>
              <ProgressBar
                value={memoryUsed}
                max={memoryTotal}
                color={memoryPercent > 90 ? "bg-red-500" : memoryPercent > 70 ? "bg-yellow-500" : "bg-blue-500"}
              />
            </View>

            {/* Disk */}
            <View className="bg-card border border-border rounded-xl p-4 mb-4">
              <Text weight="semibold" className="text-sm text-foreground mb-2">
                Disk
              </Text>
              <View className="flex-row items-center justify-between">
                <Text weight="bold" className="text-2xl text-foreground">
                  {diskPercent}%
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatBytes(diskUsed)} / {formatBytes(diskTotal)}
                </Text>
              </View>
              <ProgressBar
                value={diskUsed}
                max={diskTotal}
                color={diskPercent > 90 ? "bg-red-500" : diskPercent > 70 ? "bg-yellow-500" : "bg-purple-500"}
              />
            </View>

            {/* Interfaces */}
            {interfaces.length > 0 && (
              <View className="mb-4">
                <Text weight="semibold" className="text-base text-foreground mb-3">
                  {t("monitoring.interfaces")}
                </Text>
                {interfaces.map((iface: any) => (
                  <View key={iface.id} className="bg-card border border-border rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full mr-2 ${iface.is_running ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Text weight="semibold" className="text-sm text-foreground">
                          {iface.interface_name}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {iface.interface_type}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <View className="flex-row items-center">
                        <Ionicons name="arrow-down" size={12} color={colors.success} />
                        <Text className="text-xs text-muted-foreground ml-1">
                          {formatBps(iface.rx_bps)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="arrow-up" size={12} color={colors.info} />
                        <Text className="text-xs text-muted-foreground ml-1">
                          {formatBps(iface.tx_bps)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
