import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { Card } from "@/src/components/global/card";
import { FormInput } from "@/src/components/global/form-input";
import { AsyncSelect } from "@/src/components/global/select-searchable";
import { MapLocationPicker } from "@/src/components/global/map-picker";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { createServiceConnectionSchema, CreateServiceConnectionInput } from "@/src/features/connection-service/schema";
import { useCreateServiceConnection } from "@/src/features/connection-service/hooks";
import { packageService } from "@/src/features/package/service";
import { customerService } from "@/src/features/customer/service";
import { useThemeColor } from '@/src/lib/theme-colors';

export default function ServiceCreateScreen() {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);

  useEffect(() => {
    if (!isTeknisi) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [isTeknisi]);
  const createService = useCreateServiceConnection();
  const isSubmitting = createService.isPending;
  const [showMap, setShowMap] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);

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
      const customers = res?.data?.customers || [];
      return {
        data: customers.map((c: any) => ({
          label: `${c.name || "-"} • ${c.phone || "-"}`,
          value: c.id,
        })),
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
    if (location) {
      formData.append("lat", location.lat);
      formData.append("long", location.lng);
    }
    if (data.notes) formData.append("notes", data.notes);

    createService.mutate(formData, {
      onSuccess: () => router.back(),
    });
  };

  if (isTeknisi) {
    return null;
  }

  return (
    <ScreenWrapper headerTitle={t("service.createTitle")} showBackButton>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="rounded-2xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("customer.stepService")}
            </Text>
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

              <FormInput
                control={control}
                name="address"
                label={t("service.addressLabel")}
                placeholder={t("service.addressPlaceholder")}
                isTextarea
              />

              {/* Map Picker (sets address automatically) */}
              <View>
                <Text weight="medium" className="text-sm text-muted-foreground mb-1.5">
                  {t("service.selectOnMap")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMap(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 min-h-11"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="location-outline" size={20} color={colors.icon} />
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
                    <Ionicons name="map" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          <Card className="rounded-2xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("customer.stepTechnical")}
            </Text>
            <View className="gap-y-3">
              <FormInput
                control={control}
                name="notes"
                label={t("service.notesLabel")}
                placeholder={t("service.notesPlaceholder")}
                isTextarea
              />
            </View>
          </Card>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="pt-3 pb-2 border-t border-border/10 bg-background"
        >
          <Button
            title={isSubmitting ? t("service.creating") : t("service.submitBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          setLocation({ lat: lat.toString(), lng: lng.toString() });
          if (addressText) {
            setValue("address", addressText);
          }
        }}
        initialAddress={watch("address")}
      />
    </ScreenWrapper>
  );
}
