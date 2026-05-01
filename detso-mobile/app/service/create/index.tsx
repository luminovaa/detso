import React, { useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
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
import { createServiceConnectionSchema, CreateServiceConnectionInput } from "@/src/features/connection-service/schema";
import { useCreateServiceConnection } from "@/src/features/connection-service/hooks";
import { packageService } from "@/src/features/package/service";
import { customerService } from "@/src/features/customer/service";

export default function ServiceCreateScreen() {
  const { t } = useT();
  const createService = useCreateServiceConnection();
  const isSubmitting = createService.isPending;
  const [showMap, setShowMap] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const { control, handleSubmit, setValue, watch } = useForm<CreateServiceConnectionInput>({
    resolver: zodResolver(createServiceConnectionSchema) as any,
    defaultValues: {
      customer_id: "",
      package_id: "",
      address: "",
      package_name: "",
      package_speed: "",
      ip_address: "",
      mac_address: "",
      notes: "",
    },
  });

  const fetchCustomers = useCallback(
    async (search: string, page: number) => {
      const res = await customerService.getAll({ search, page, limit: 20 });
      const services = res?.data?.services || [];
      // Get unique customers from services
      const seen = new Set<string>();
      const customers = services
        .filter((s: any) => {
          if (seen.has(s.customer?.id)) return false;
          seen.add(s.customer?.id);
          return true;
        })
        .map((s: any) => ({
          label: `${s.customer?.name || "-"} • ${s.customer?.phone || "-"}`,
          value: s.customer?.id || "",
        }));
      return {
        data: customers,
        hasNextPage: res?.data?.pagination?.hasNextPage || false,
      };
    },
    [],
  );

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

  const onSubmit = (data: CreateServiceConnectionInput) => {
    const formData = new FormData();
    formData.append("customer_id", data.customer_id);
    formData.append("package_id", data.package_id);
    formData.append("address", data.address);
    formData.append("package_name", data.package_name || selectedPackage?.name || "");
    formData.append("package_speed", data.package_speed || selectedPackage?.speed || "");
    if (data.ip_address) formData.append("ip_address", data.ip_address);
    if (data.mac_address) formData.append("mac_address", data.mac_address);
    if (data.notes) formData.append("notes", data.notes);

    createService.mutate(formData, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("service.createTitle")} showBackButton>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-y-3">
            {/* Customer Selector */}
            <AsyncSelect
              control={control}
              name="customer_id"
              label={t("service.customerLabel")}
              placeholder={t("service.customerPlaceholder")}
              fetchOptions={fetchCustomers}
              required
              highlightSearch
            />

            {/* Package Selector */}
            <AsyncSelect
              control={control}
              name="package_id"
              label={t("service.packageLabel")}
              placeholder={t("service.packagePlaceholder")}
              fetchOptions={fetchPackages}
              required
              highlightSearch
              onSelectFullObject={(item) => {
                setSelectedPackage(item);
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
                    {watch("address") ? (
                      <Text className="text-foreground text-xs" numberOfLines={2}>
                        {watch("address")}
                      </Text>
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
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? t("service.creating") : t("service.submitBtn")}
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
        initialAddress={watch("address")}
      />
    </ScreenWrapper>
  );
}
