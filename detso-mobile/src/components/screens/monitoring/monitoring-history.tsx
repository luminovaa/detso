import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Pressable, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { EmptyState } from "@/src/components/global/empty-state";
import { useHistoricalData } from "@/src/features/mikrotik/hooks";
import { MonitoringData } from "@/src/features/mikrotik/schema";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";
import { downsample } from "@/src/lib/downsample";
import { safeNumber } from "@/src/lib/format";

interface Props {
  routerId: string;
}

const RANGES = [3, 12, 24] as const;
const MAX_POINTS = 120;

function ChartCard({ title, data, maxValue, color }: {
  title: string;
  data: { value: number }[];
  maxValue?: number;
  color: string;
}) {
  const colors = useThemeColor();
  const { width } = useWindowDimensions();

  return (
    <View className="bg-card border border-border rounded-xl p-4 mb-4">
      <Text weight="semibold" className="text-sm text-foreground mb-3">
        {title}
      </Text>
      <LineChart
        data={data}
        width={width - 96}
        height={140}
        adjustToWidth
        thickness={2}
        color={color}
        hideDataPoints
        maxValue={maxValue}
        noOfSections={4}
        yAxisTextStyle={{ fontSize: 10, color: colors.icon }}
        yAxisColor="transparent"
        xAxisColor="transparent"
        initialSpacing={0}
        disableScroll
      />
    </View>
  );
}

export function MonitoringHistory({ routerId }: Props) {
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const [hours, setHours] = useState<number>(3);
  const { data, isLoading, refetch, isRefetching } = useHistoricalData(routerId, hours);

  const records: MonitoringData[] = data?.data?.data ?? [];
  const points = downsample(records, MAX_POINTS);

  const cpuData = points.map((r) => ({ value: safeNumber(r.cpu_load) }));
  const memoryData = points.map((r) => {
    const total = safeNumber(r.memory_total);
    const used = safeNumber(r.memory_used);
    return { value: total > 0 ? Math.round((used / total) * 100) : 0 };
  });
  const sessionData = points.map((r) => ({ value: safeNumber(r.active_sessions) }));

  return (
    <ScreenWrapper headerTitle={t("monitoring.historyTitle")} showBackButton={true}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View className="mt-4 flex-1">
          {/* Range chips */}
          <View className="flex-row gap-2 mb-4">
            {RANGES.map((range) => (
              <Pressable
                key={range}
                onPress={() => setHours(range)}
                className={`px-4 py-2 rounded-full border ${
                  hours === range ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-sm ${
                    hours === range ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t(`monitoring.historyRange${range}h`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
            </View>
          ) : points.length < 2 ? (
            <EmptyState
              icon="stats-chart-outline"
              title={t("monitoring.historyEmpty")}
              description={t("monitoring.historyEmptyDesc")}
            />
          ) : (
            <>
              <ChartCard
                title={t("monitoring.historyCpu")}
                data={cpuData}
                maxValue={100}
                color={colors.info}
              />
              <ChartCard
                title={t("monitoring.historyMemory")}
                data={memoryData}
                maxValue={100}
                color={colors.success}
              />
              <ChartCard
                title={t("monitoring.historySessions")}
                data={sessionData}
                color={colors.warning}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
