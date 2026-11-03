import React from "react";
import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Skeleton } from "@/src/components/global/skeleton";
import { Button } from "@/src/components/global/button";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
// --- State & Logic ---
import { usePackage, useDeletePackage } from "@/src/features/package/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";

import { useThemeColor } from '@/src/lib/theme-colors';

interface PackageData {
  id: string;
  name: string;
  speed: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role !== "TENANT_TEKNISI";
  const { data: response, isLoading, refetch, isRefetching } = usePackage(id!);
  const packageData = response?.data as PackageData | undefined;
  const isRefreshing = isRefetching;

  const deletePackageMutation = useDeletePackage();
  const isDeleting = deletePackageMutation.isPending;

  const onRefresh = () => {
    refetch();
  };

  const handleEdit = () => {
    router.push(`/package/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      t("package.deleteConfirm"),
      t("package.deleteMessage"),
      [
        {
          text: t("package.cancelBtn"),
          style: "cancel",
        },
        {
          text: t("package.deleteBtn"),
          style: "destructive",
          onPress: () => {
            deletePackageMutation.mutate(id!, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const infoRows = [
    {
      label: t("package.priceLabel"),
      value: packageData ? formatPrice(packageData.price) : "-",
    },
    {
      label: t("package.speedLabel"),
      value: packageData?.speed ?? "-",
    },
    {
      label: t("package.createdAt"),
      value: packageData ? formatDate(packageData.created_at) : "-",
    },
    {
      label: t("package.updatedAt"),
      value: packageData ? formatDate(packageData.updated_at) : "-",
    },
  ];
  if (isLoading && !packageData) {
    return (
      <ScreenWrapper headerTitle={t("package.detailTitle")} showBackButton>
        <View className="p-4 gap-y-6">
          <View className="items-center gap-y-4">
            <Skeleton className="w-24 h-24 rounded-3xl" />
            <Skeleton className="w-48 h-8 rounded-xl" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </View>
          <View className="gap-y-4">
            <Skeleton className="w-full h-20 rounded-2xl" />
            <Skeleton className="w-full h-20 rounded-2xl" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerTitle={t("package.detailTitle")}
      showBackButton
      headerRightNode={
        canManage ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11"
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={20} color={colors.white} />
          </Button>
        ) : undefined
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
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Package Hero Summary */}
        <View className="bg-card border border-border rounded-2xl p-6 items-center mb-6">
          <View className="w-20 h-20 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20 mb-4">
            <Ionicons name="cube" size={40} color={colors.primary} />
          </View>
          <Text weight="bold" className="text-2xl text-foreground text-center mb-1">
            {packageData?.name}
          </Text>
          <Text weight="bold" className="text-lg text-primary">
            {packageData ? formatPrice(packageData.price) : "-"}
          </Text>
        </View>

        {/* Package Details Grouped Section */}
        <GroupedSection title={t("package.detailTitle")}>
          {infoRows.map((row, index) => {
            const isLast = index === infoRows.length - 1;
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

        {/* Delete Button (Owner & Admin only) */}
        {canManage && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full min-h-11"
            onPress={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
            title={t("package.deleteBtn")}
            leftIcon={<Ionicons name="trash-outline" size={20} color={colors.white} />}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
