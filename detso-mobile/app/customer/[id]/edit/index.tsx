import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
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
import { FormDatePicker } from "@/src/components/global/date-picker";
import { MapLocationPicker } from "@/src/components/global/map-picker";
import { Card } from "@/src/components/global/card";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { updateCustomerSchema, UpdateCustomerInput } from "@/src/features/customer/schema";
import { useCustomer, useUpdateCustomer } from "@/src/features/customer/hooks";

import { useThemeColor } from '@/src/lib/theme-colors';

export default function CustomerEditScreen() {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!isTeknisi) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [isTeknisi]);
  const [showMap, setShowMap] = useState(false);
  const [serviceAddress, setServiceAddress] = useState("");
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");

  const { data: response, isLoading: isLoadingData } = useCustomer(isTeknisi ? "" : id!);
  const customerData = response?.data as any;

  const updateCustomer = useUpdateCustomer();
  const isSubmitting = updateCustomer.isPending;

  const { control, handleSubmit, setValue } = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      nik: "",
      birth_place: "",
    },
  });

  useEffect(() => {
    if (customerData) {
      setValue("name", customerData.name || "");
      setValue("phone", customerData.phone || "");
      setValue("email", customerData.email || "");
      setValue("nik", customerData.nik || "");
      setValue("birth_place", customerData.birth_place || "");
      if (customerData.birth_date) {
        setValue("birth_date", new Date(customerData.birth_date));
      }

      // Service connection data (first service)
      const service = customerData.services?.[0];
      if (service) {
        setServiceAddress(service.address || "");
        setLat(service.lat || "");
        setLong(service.long || "");
      }
    }
  }, [customerData, setValue]);

  const onSubmit = (data: UpdateCustomerInput) => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;
    if (data.nik) payload.nik = data.nik;
    if (data.birth_place) payload.birth_place = data.birth_place;
    if (data.birth_date) payload.birth_date = new Date(data.birth_date).toISOString();

    updateCustomer.mutate(
      { id: id!, data: payload },
      { onSuccess: () => router.back() },
    );
  };

  if (isTeknisi) {
    return null;
  }

  if (isLoadingData) {
    return (
      <ScreenWrapper headerTitle={t("customer.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("customer.editTitle")} showBackButton>
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
          {/* Personal Data Section */}
          <Card className="rounded-2xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("customer.stepPersonal")}
            </Text>
            <View className="gap-y-3">
              <FormInput control={control} name="name" label={t("customer.nameLabel")} placeholder={t("customer.namePlaceholder")} />
              <FormInput control={control} name="nik" label={t("customer.nikLabel")} placeholder={t("customer.nikPlaceholder")} keyboardType="numeric" />
              <FormInput control={control} name="phone" label={t("customer.phoneLabel")} placeholder={t("customer.phonePlaceholder")} keyboardType="phone-pad" />
              <FormInput control={control} name="email" label={t("customer.emailLabel")} placeholder={t("customer.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
              <FormInput control={control} name="birth_place" label={t("customer.birthPlaceLabel")} placeholder={t("customer.birthPlacePlaceholder")} />
              <FormDatePicker control={control} name="birth_date" label={t("customer.birthDateLabel")} placeholder={t("customer.birthDatePlaceholder")} maximumDate={new Date()} />
            </View>
          </Card>

          {/* Installation Location (read-only info) */}
          {(lat || long || serviceAddress) && (
            <Card className="rounded-2xl p-4 mb-4">
              <Text weight="bold" className="text-base text-foreground mb-3">
                {t("customer.stepService")}
              </Text>
              <View>
                <Label>{t("customer.selectOnMap")}</Label>
                <TouchableOpacity
                  onPress={() => setShowMap(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1 min-h-11"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="location-outline" size={20} color={colors.icon} />
                    <View className="ml-2 flex-1">
                      {lat && long ? (
                        <View>
                          <Text className="text-foreground text-xs" numberOfLines={2}>
                            {serviceAddress || "Lokasi tersimpan"}
                          </Text>
                          <Text className="text-muted-foreground text-[10px] mt-1">
                            {lat}, {long}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-muted-foreground">{t("customer.selectOnMap")}</Text>
                      )}
                    </View>
                  </View>
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <Ionicons name="map" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="pt-3 pb-2 border-t border-border/10 bg-background"
        >
          <Button
            title={isSubmitting ? t("customer.updating") : t("customer.saveBtn")}
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
        onLocationSelected={(newLat, newLng, addressText) => {
          setLat(newLat.toString());
          setLong(newLng.toString());
          if (addressText) setServiceAddress(addressText);
        }}
        initialCoordinate={
          lat && long
            ? { latitude: parseFloat(lat), longitude: parseFloat(long) }
            : null
        }
        initialAddress={serviceAddress}
      />
    </ScreenWrapper>
  );
}
