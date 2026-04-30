import React from "react";
import { View, ScrollView, RefreshControl, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";
import { Badge } from "@/src/components/global/badge";
import { Skeleton } from "@/src/components/global/skeleton";
import { Button } from "@/src/components/global/button";

// --- State & Logic ---
import { useTenant } from "@/src/features/tenant/hooks";
import { useT } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";

export default function ISPDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colorScheme } = useColorScheme();

  const { data: response, isLoading, refetch, isRefetching } = useTenant(id!);
  const tenant = response?.data as Tenant | undefined;
  const isRefreshing = isRefetching;

  const onRefresh = () => {
    refetch();
  };

  const handleCall = () => {
    if (tenant?.phone) Linking.openURL(`tel:${tenant.phone}`);
  };

  const handleMap = () => {
    if (tenant?.address)
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}`,
      );
  };

  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

    if (isLoading && !tenant) {
    return (
      <ScreenWrapper headerTitle={t("isp.detailTitle")} showBackButton>
        <View className="p-4 gap-y-8">
          {/* Skeleton Hero */}
          <View className="items-center gap-y-4">
            <Skeleton className="w-28 h-28 rounded-[40px]" />
            <Skeleton className="w-56 h-9 rounded-xl" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </View>

          {/* Skeleton Actions */}
          <View className="flex-row justify-center gap-x-4">
            <Skeleton className="w-24 h-12 rounded-full" />
            <Skeleton className="w-24 h-12 rounded-full" />
          </View>

          {/* Skeleton Stats */}
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-[48%] h-24 rounded-3xl" />
            ))}
          </View>

          {/* Skeleton Info */}
          <Card className="p-6 gap-y-6 border-border/40">
            <View className="flex-row gap-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <View className="flex-1 gap-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-5" />
              </View>
            </View>
            <View className="flex-row gap-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <View className="flex-1 gap-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-5" />
              </View>
            </View>
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  if (!tenant) return null;

  const StatCard = ({
    icon,
    label,
    value,
    colorClass = "text-primary",
  }: any) => (
    <Card className="w-[48%] p-4 border-border/50 bg-card shadow-sm">
      <View
        className="w-12 h-12 rounded-2xl bg-muted/50 items-center justify-center mb-4"
      >
        <Ionicons
          name={icon}
          size={22}
          color={isDark ? "#66a3ff" : "#102a4d"}
        />
      </View>
      <View>
        <Text weight="bold" className={`text-2xl ${colorClass}`}>
          {value.toLocaleString()}
        </Text>
        <Text weight="medium" className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          {label}
        </Text>
      </View>
    </Card>
  );

    return (
    <ScreenWrapper
      headerTitle={t("isp.detailTitle")}
      showBackButton
      headerRightNode={
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push(`/isp/${id}/edit`)}
          leftIcon={
            <Ionicons
              name="create-outline"
              size={20}
              color="white"
            />
          }
        />
      }
    >

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      >
        {/* --- Hero Section --- */}
        <View className="items-center mt-4 mb-8">
          <View className="relative">
            <Avatar
              src={tenant.logo}
              alt={tenant.name}
              size="2xl"
              className="bg-primary/5 border-4 border-background shadow-xl rounded-[40px]"
            />
            <View className="absolute -bottom-1 -right-1">
              <Badge
                variant={tenant.is_active ? "success" : "destructive"}
                className="px-3 border-2 border-background"
              >
                {tenant.is_active ? t("isp.active") : t("isp.inactive")}
              </Badge>
            </View>
          </View>

          <Text
            weight="bold"
            className="text-3xl text-foreground text-center mt-6 mb-1"
          >
            {tenant.name}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {tenant.id.slice(0, 8).toUpperCase()} • {t("isp.detailTitle")}
          </Text>
        </View>

        {/* --- Quick Actions --- */}
        <View className="flex-row justify-center gap-x-4 mb-10">
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-border/60"
            leftIcon={<Ionicons name="call" size={18} color={primaryColor} />}
            title={t("isp.phone")}
            onPress={handleCall}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-border/60"
            leftIcon={<Ionicons name="map" size={18} color={primaryColor} />}
            title={t("isp.address")}
            onPress={handleMap}
          />
        </View>

        {/* --- Stats Header --- */}
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text weight="bold" className="text-lg text-foreground">
            {t("isp.overview")}
          </Text>
        </View>

        {/* --- Stats Grid --- */}
        <View className="flex-row flex-wrap justify-between mb-8 gap-y-4">
          <StatCard
            icon="people"
            label={t("isp.totalUsers")}
            value={tenant.stats.total_users}
          />
          <StatCard
            icon="person"
            label={t("isp.customers")}
            value={tenant.stats.total_customers}
          />
          <StatCard
            icon="cube"
            label={t("isp.totalPackages")}
            value={tenant.stats.total_packages}
            colorClass="text-orange-500"
          />
          <StatCard
            icon="ticket"
            label={t("isp.totalTickets")}
            value={tenant.stats.total_tickets}
            colorClass="text-destructive"
          />
        </View>

        {/* --- Information Section --- */}
        <Text weight="bold" className="text-lg text-foreground mb-4 px-1">
          {t("isp.contactInfo")}
        </Text>

        <Card className="p-6 border-border/40 bg-card overflow-hidden">
          <View className="gap-y-6">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/80 items-center justify-center mr-4">
                <Ionicons name="location" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text
                  weight="semibold"
                  className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[1.5px]"
                >
                  {t("isp.address")}
                </Text>
                <Text className="text-sm text-foreground leading-5">
                  {tenant.address}
                </Text>
              </View>
            </View>

            <View className="h-[1px] bg-border/40 w-full" />

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/80 items-center justify-center mr-4">
                <Ionicons name="call" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text
                  weight="semibold"
                  className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[1.5px]"
                >
                  {t("isp.phone")}
                </Text>
                <Text className="text-sm text-foreground">{tenant.phone}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-border/40 w-full" />

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/80 items-center justify-center mr-4">
                <Ionicons name="calendar" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text
                  weight="semibold"
                  className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[1.5px]"
                >
                  {t("isp.createdAt")}
                </Text>
                <Text className="text-sm text-foreground">
                  {new Date(tenant.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
