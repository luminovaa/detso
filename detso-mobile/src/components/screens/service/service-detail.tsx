import React from "react";
import { View, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Skeleton } from "@/src/components/global/skeleton";
import { Button } from "@/src/components/global/button";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
import { CustomerLocationMap } from "@/src/components/screens/customer/customer-location-map";

// --- State & Logic ---
import { useService, useDeleteServiceConnection } from "@/src/features/connection-service/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { ServiceConnection } from "@/src/lib/types";
import { SERVICE_STATUS_VARIANTS } from "@/src/lib/status-variants";
import { formatDate } from "@/src/lib/format-date";
import { hasValidCoords } from "@/src/lib/map-utils";
import { canManageRecords } from "@/src/lib/route-roles";
import { useThemeColor } from "@/src/lib/theme-colors";

const priceFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canManage = canManageRecords(user?.role);

  const { data: response, isLoading, refetch, isRefetching } = useService(id!);
  const serviceData = response?.data as ServiceConnection | undefined;

  const deleteServiceMutation = useDeleteServiceConnection();
  const isDeleting = deleteServiceMutation.isPending;

  const handleEdit = () => {
    router.push(`/service/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(t("service.deleteConfirm"), t("service.deleteMessage"), [
      { text: t("service.cancelBtn"), style: "cancel" },
      {
        text: t("service.deleteBtn"),
        style: "destructive",
        onPress: () => {
          deleteServiceMutation.mutate(id!, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return t("service.statusActive");
      case "INACTIVE":
        return t("service.statusInactive");
      case "SUSPENDED":
        return t("service.statusSuspended");
      default:
        return status;
    }
  };

  if (isLoading && !serviceData) {
    return (
      <ScreenWrapper headerTitle={t("service.detailTitle")} showBackButton>
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

  if (!serviceData) {
    return (
      <ScreenWrapper headerTitle={t("service.detailTitle")} showBackButton>
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.iconMuted} />
          <Text className="text-base text-muted-foreground mt-3">{t("service.emptyTitle")}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const customerId = serviceData.customer?.id;
  const rawPrice = serviceData.package_price ?? serviceData.package_details?.price ?? null;
  const statusColorVariant = SERVICE_STATUS_VARIANTS[serviceData.status] || "neutral";
  const showLocationMap = hasValidCoords(serviceData.lat, serviceData.long);

  const infoRows = [
    {
      label: t("service.customerLabel"),
      value: serviceData.customer?.name || "-",
      onPress: customerId ? () => router.push(`/customer/${customerId}/detail`) : undefined,
    },
    {
      label: t("service.idPelLabel"),
      value: serviceData.id_pel || "-",
    },
    {
      label: t("service.packageLabel"),
      value: serviceData.package_name || "-",
    },
    {
      label: t("service.speedLabel"),
      value: serviceData.package_speed || "-",
    },
    {
      label: t("service.priceLabel"),
      value: rawPrice !== null ? priceFormatter.format(rawPrice) : "-",
    },
    {
      label: t("service.addressLabel"),
      value: serviceData.address || "-",
    },
    {
      label: t("service.ipLabel"),
      value: serviceData.ip_address || "-",
    },
    {
      label: t("service.macLabel"),
      value: serviceData.mac_address || "-",
    },
    ...(serviceData.notes
      ? [
          {
            label: t("service.notesLabel"),
            value: serviceData.notes,
          },
        ]
      : []),
    {
      label: t("service.createdAt"),
      value: serviceData.created_at ? formatDate(new Date(serviceData.created_at)) : "-",
    },
  ];

  return (
    <ScreenWrapper
      headerTitle={t("service.detailTitle")}
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
        className="flex-1 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Service Hero Summary */}
        <View className="bg-card border border-border rounded-2xl p-6 items-center mb-6">
          <View className="w-20 h-20 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20 mb-4">
            <Ionicons name="wifi" size={38} color={colors.primary} />
          </View>
          <Text weight="bold" className="text-xl text-foreground text-center mb-1">
            {serviceData.package_name}
          </Text>
          {serviceData.customer?.name && (
            <Text className="text-sm text-muted-foreground mb-2 text-center">
              {serviceData.customer.name}
            </Text>
          )}
          <Badge colorVariant={statusColorVariant} className="self-center">
            {getStatusLabel(serviceData.status)}
          </Badge>
        </View>

        {/* Service Details Grouped Section */}
        <GroupedSection title={t("service.detailTitle")}>
          {infoRows.map((row, index) => {
            const isLast = index === infoRows.length - 1;
            const content = (
              <View
                className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
              >
                <Text className="text-sm text-muted-foreground">{row.label}</Text>
                <Text
                  weight="semibold"
                  className={`text-sm text-right flex-1 ${row.onPress ? "text-primary" : "text-foreground"}`}
                >
                  {row.value}
                </Text>
              </View>
            );

            if (row.onPress) {
              return (
                <TouchableOpacity key={row.label} activeOpacity={0.7} onPress={row.onPress}>
                  {content}
                </TouchableOpacity>
              );
            }

            return <React.Fragment key={row.label}>{content}</React.Fragment>;
          })}
        </GroupedSection>

        {/* Service Location Map */}
        {showLocationMap && (
          <View className="mb-6">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              {t("service.locationTitle")}
            </Text>
            <CustomerLocationMap
              services={[
                {
                  id: serviceData.id,
                  lat: serviceData.lat,
                  long: serviceData.long,
                  address: serviceData.address,
                  package_name: serviceData.package_name,
                },
              ]}
            />
          </View>
        )}

        {/* Delete Button (Owner & Admin only) */}
        {canManage && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full min-h-11"
            onPress={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
            title={t("service.deleteBtn")}
            leftIcon={<Ionicons name="trash-outline" size={20} color={colors.white} />}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
