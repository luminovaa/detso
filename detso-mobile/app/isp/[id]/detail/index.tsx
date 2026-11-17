import React from "react";
import { View, ScrollView, RefreshControl, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";
import { Badge } from "@/src/components/global/badge";
import { Skeleton } from "@/src/components/global/skeleton";
import { Button } from "@/src/components/global/button";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
// --- State & Logic ---
import { useTenant } from "@/src/features/tenant/hooks";
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";
import { useThemeColor } from '@/src/lib/theme-colors';

export default function ISPDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const colors = useThemeColor();
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

  const primaryColor = colors.primary;
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
          <View className="bg-card border border-border rounded-2xl p-6 gap-y-6">
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
          </View>
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
    <View className="w-[48%] p-4 bg-card border border-border rounded-2xl">
      <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mb-3">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View>
        <Text weight="bold" className={`text-2xl ${colorClass}`}>
          {value.toLocaleString()}
        </Text>
        <Text weight="medium" className="text-xs text-muted-foreground mt-1">
          {label}
        </Text>
      </View>
    </View>
  );

  const contactRows = [
    {
      label: t("isp.address"),
      value: tenant.address || "-",
    },
    {
      label: t("isp.phone"),
      value: tenant.phone || "-",
    },
    {
      label: t("isp.createdAt"),
      value: new Date(tenant.created_at).toLocaleDateString(
        locale === "en" ? "en-US" : "id-ID",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      ),
    },
  ];

    return (
    <ScreenWrapper
      headerTitle={t("isp.detailTitle")}
      showBackButton
      headerRightNode={
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 min-w-11"
          onPress={() => router.push(`/isp/${id}/edit`)}
          leftIcon={
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.white}
            />
          }
        />
      }
    >

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
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
        <View className="flex-row justify-center gap-x-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 rounded-2xl border-border"
            leftIcon={<Ionicons name="call" size={18} color={primaryColor} />}
            title={t("isp.phone")}
            onPress={handleCall}
          />
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 rounded-2xl border-border"
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
            colorClass="text-primary"
          />
          <StatCard
            icon="ticket"
            label={t("isp.totalTickets")}
            value={tenant.stats.total_tickets}
            colorClass="text-destructive"
          />
        </View>

        {/* --- Information Section --- */}
        <GroupedSection title={t("isp.contactInfo")}>
          {contactRows.map((row, idx) => {
            const isLast = idx === contactRows.length - 1;
            return (
              <View
                key={row.label}
                className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
              >
                <Text className="text-sm text-muted-foreground">{row.label}</Text>
                <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
                  {row.value}
                </Text>
              </View>
            );
          })}
        </GroupedSection>
      </ScrollView>
    </ScreenWrapper>
  );
}
