import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Label } from "@/src/components/global/label";
import { AsyncSelect } from "@/src/components/global/select-searchable";
import { MapLocationPicker } from "@/src/components/global/map-picker";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { updateServiceConnectionSchema, UpdateServiceConnectionInput } from "@/src/features/connection-service/schema";
import { useUpdateServiceConnection } from "@/src/features/connection-service/hooks";
import { useInfiniteCustomers } from "@/src/features/customer/hooks";
import { packageService } from "@/src/features/package/service";
import { customerService } from "@/src/features/customer/service";
import { ServiceConnection } from "@/src/lib/types";
import { useQuery } from "@tanstack/react-query";

import { COLORS } from '@/src/lib/colors';
type StatusOption = "ACTIVE" | "INACTIVE" | "SUSPENDED";

const STATUS_OPTIONS: StatusOption[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function ServiceEditScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showMap, setShowMap] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>("ACTIVE");
  const [serviceData, setServiceData] = useState<ServiceConnection | null>(null);

  // Fetch service data from customer list (since there's no GET /service-connection/:id)
  const { data: listResponse, isLoading: isLoadingData } = useInfiniteCustomers({ limit: 100 });

  // Find the specific service from the list
  useEffect(() => {
    if (listResponse?.pages) {
      const allServices: ServiceConnection[] = listResponse.pages.flatMap(
        (page: any) => page?.data?.services || []
      );
      const found = allServices.find((s) => s.id === id);
      if (found) {
        setServiceData(found);
      }
    }
  }, [listResponse, id]);

  const updateService = useUpdateServiceConnection();
  const isSubmitting = updateService.isPending;

  const { control, handleSubmit, setValue, watch } = useForm<UpdateServiceConnectionInput>({
    resolver: zodResolver(updateServiceConnectionSchema) as any,
    defaultValues: {
      package_id: "",
      address: "",
      ip_address: "",
      mac_address: "",
      notes: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (serviceData) {
      setValue("package_id", serviceData.package_details ? undefined : undefined);
      setValue("address", serviceData.address || "");
      setValue("ip_address", serviceData.ip_address || "");
      setValue("mac_address", serviceData.mac_address || "");
      setValue("notes", serviceData.notes || "");
      setValue("status", serviceData.status);
      setSelectedStatus(serviceData.status);
    }
  }, [serviceData, setValue]);

  const fetchPackages = useCallback(
    async (search: string, page: number) => {
      const res = await packageService.getAll({ search, page, limit: 20 });
      const packages = res?.data?.packages || [];
      return {
        data: packages.map((pkg: any) => ({
          label: `${pkg.name} - ${pkg.speed}`,
          value: pkg.id,
          name: pkg.name,
          speed: pkg.speed,
          price: pkg.price,
        })),
        hasNextPage: res?.data?.pagination?.hasNextPage || false,
      };
    },
    [],
  );

  const getStatusLabel = (status: StatusOption) => {
    switch (status) {
      case "ACTIVE": return t("service.statusActive");
      case "INACTIVE": return t("service.statusInactive");
      case "SUSPENDED": return t("service.statusSuspended");
    }
  };

  const getStatusStyle = (status: StatusOption, isActive: boolean) => {
    if (!isActive) return styles.statusPill;
    switch (status) {
      case "ACTIVE": return [styles.statusPill, styles.statusActive];
      case "INACTIVE": return [styles.statusPill, styles.statusInactive];
      case "SUSPENDED": return [styles.statusPill, styles.statusSuspended];
    }
  };

  const onSubmit = (data: UpdateServiceConnectionInput) => {
    const payload: UpdateServiceConnectionInput = {
      address: data.address || undefined,
      ip_address: data.ip_address || undefined,
      mac_address: data.mac_address || undefined,
      notes: data.notes || undefined,
      status: selectedStatus,
    };

    // Only include package_id if changed
    if (data.package_id) {
      payload.package_id = data.package_id;
    }

    updateService.mutate(
      { id: id!, data: payload },
      { onSuccess: () => router.back() },
    );
  };

  if (isLoadingData && !serviceData) {
    return (
      <ScreenWrapper headerTitle={t("service.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("service.editTitle")} showBackButton>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-y-3">
            {/* Customer Info (read-only) */}
            {serviceData?.customer && (
              <View className="bg-muted/30 rounded-xl p-3 border border-border/30 mb-2">
                <Text className="text-xs text-muted-foreground">{t("service.customerLabel")}</Text>
                <Text weight="semibold" className="text-foreground text-base mt-0.5">
                  {serviceData.customer.name}
                </Text>
                {serviceData.customer.phone && (
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {serviceData.customer.phone}
                  </Text>
                )}
              </View>
            )}

            {/* Package Selector */}
            <AsyncSelect
              control={control}
              name="package_id"
              label={t("service.packageLabel")}
              placeholder={t("service.packagePlaceholder")}
              fetchOptions={fetchPackages}
              initialLabel={serviceData ? `${serviceData.package_name} - ${serviceData.package_speed}` : ""}
              highlightSearch
              onSelectFullObject={(item) => {
                setValue("package_name", item.name);
                setValue("package_speed", item.speed);
              }}
            />

            {/* Installation Address */}
            <FormInput
              control={control}
              name="address"
              label={t("service.addressLabel")}
              placeholder={t("service.addressPlaceholder")}
              isTextarea
            />

            {/* Map Picker */}
            <View>
              <Label>{t("service.selectOnMap")}</Label>
              <TouchableOpacity
                onPress={() => setShowMap(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <View className="ml-2 flex-1">
                    {serviceData?.lat && serviceData?.long ? (
                      <View>
                        <Text className="text-foreground text-xs" numberOfLines={2}>
                          {watch("address") || serviceData.address || "Lokasi tersimpan"}
                        </Text>
                        <Text className="text-muted-foreground text-[10px] mt-1">
                          {serviceData.lat}, {serviceData.long}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-muted-foreground">{t("service.selectOnMap")}</Text>
                    )}
                  </View>
                </View>
                <View className="bg-primary/10 p-2 rounded-lg">
                  <Ionicons name="map" size={20} color="#1E40AF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Technical Info */}
            <FormInput
              control={control}
              name="ip_address"
              label={t("service.ipLabel")}
              placeholder={t("service.ipPlaceholder")}
              keyboardType="numeric"
            />

            <FormInput
              control={control}
              name="mac_address"
              label={t("service.macLabel")}
              placeholder={t("service.macPlaceholder")}
              autoCapitalize="characters"
            />

            <FormInput
              control={control}
              name="notes"
              label={t("service.notesLabel")}
              placeholder={t("service.notesPlaceholder")}
              isTextarea
            />

            {/* Status Selector */}
            <View className="mb-2">
              <Label>{t("service.statusLabel")}</Label>
              <View className="flex-row gap-x-2 mt-2">
                {STATUS_OPTIONS.map((status) => {
                  const isActive = selectedStatus === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => setSelectedStatus(status)}
                      style={getStatusStyle(status, isActive)}
                    >
                      <Text
                        weight={isActive ? "bold" : "medium"}
                        className={isActive ? "text-white text-xs" : "text-muted-foreground text-xs"}
                      >
                        {getStatusLabel(status)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? t("service.updating") : t("service.saveBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          if (addressText) {
            setValue("address", addressText);
          }
        }}
        initialCoordinate={
          serviceData?.lat && serviceData?.long
            ? { latitude: parseFloat(serviceData.lat), longitude: parseFloat(serviceData.long) }
            : null
        }
        initialAddress={watch("address") || serviceData?.address || ""}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  statusActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  statusInactive: {
    backgroundColor: "#6b7280",
    borderColor: "#6b7280",
  },
  statusSuspended: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
});
