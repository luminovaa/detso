import React, { useState } from "react";
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
import { Avatar } from "@/src/components/global/avatar";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { Label } from "@/src/components/global/label";
import { showToast } from "@/src/components/global/toast";
import { MapLocationPicker } from "@/src/components/global/map-picker";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { authService } from "@/src/features/auth/service";
import { registerSchema, RegisterInput } from "@/src/features/auth/schema";
import { useMutation } from "@/src/hooks/use-async";
import { showErrorToast } from "@/src/lib/api-error";

export default function ISPCreateScreen() {
  const { t } = useT();
  const { mutate, isLoading: isSubmitting } = useMutation();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: "",
      phone: "",
      address: "",
      full_name: "",
      email: "",
      username: "",
      password: "",
      lat: "",
      long: "",
    } as any,
  });

  const onSubmit = async (data: RegisterInput) => {
    const formData = new FormData();
    formData.append("company_name", data.company_name);
    formData.append("phone", data.phone);
    formData.append("address", data.address || "");
    formData.append("full_name", data.full_name);
    formData.append("email", data.email);
    formData.append("username", data.username);
    formData.append("password", data.password);
    if (data.lat) formData.append("lat", data.lat);
    if (data.long) formData.append("long", data.long);

    if (selectedLogo) {
      const uri = selectedLogo.uri;
      const uriParts = uri.split(".");
      const extension = uriParts[uriParts.length - 1].toLowerCase();
      const mimeType = extension === "jpg" ? "jpeg" : extension;

      // @ts-ignore
      formData.append("image", {
        uri: uri,
        name: `logo-${Date.now()}.${extension}`,
        type: `image/${mimeType}`,
      });
    }

    await mutate(
      () => authService.registerTenant(formData),
      {
        onSuccess: () => {
          showToast.success(t("common.success"), t("isp.successCreate"));
          router.back();
        },
        toastTitle: t("common.error"),
      },
    );
  };

  return (
    <ScreenWrapper headerTitle={t("isp.createTitle")} showBackButton>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Upload Section */}
        <View className="items-center mb-10">
          <TouchableOpacity
            onPress={() => setShowImagePicker(true)}
            activeOpacity={0.7}
            className="relative"
          >
            <View className="p-1 rounded-[45px] border-2 border-dashed border-primary/30">
              <Avatar
                src={selectedLogo?.uri}
                alt="ISP Logo"
                size="2xl"
                className="bg-primary/5 rounded-[40px]"
              />
            </View>
            <View className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-background">
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text weight="semibold" className="text-foreground mt-4 text-sm">
            {t("isp.logoLabel")}
          </Text>
          <Text className="text-muted-foreground text-[12px] mt-1">
            {t("isp.logoHint")}
          </Text>
        </View>

        {/* Company Info Section */}
        <View className="gap-y-5 mb-10">
          <Text weight="bold" className="text-lg mb-2">
            {t("isp.companySection")}
          </Text>

          <FormInput
            control={control}
            name="company_name"
            label={t("isp.nameLabel")}
            placeholder={t("isp.namePlaceholder")}
          />

          <FormInput
            control={control}
            name="phone"
            label={t("isp.phoneLabel")}
            placeholder={t("isp.phonePlaceholder")}
            keyboardType="phone-pad"
          />

          <View>
            <Label>{t("isp.latLabel")} & {t("isp.longLabel")}</Label>
            <TouchableOpacity
              onPress={() => setShowMap(true)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="location-outline" size={20} color="#64748b" />
                <View className="ml-2 flex-1">
                  {watch("address") ? (
                    <View>
                      <Text className="text-foreground text-xs" numberOfLines={2}>
                        {watch("address")}
                      </Text>
                      <Text className="text-muted-foreground text-[10px] mt-1">
                        {watch("lat")}, {watch("long")}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-muted-foreground">
                      {t("isp.selectOnMap")}
                    </Text>
                  )}
                </View>
              </View>
              <View className="bg-primary/10 p-2 rounded-lg">
                <Ionicons name="map" size={20} color="#1E40AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Owner Info Section */}
        <View className="gap-y-5">
          <Text weight="bold" className="text-lg mb-2">
            {t("isp.ownerSection")}
          </Text>

          <FormInput
            control={control}
            name="full_name"
            label={t("isp.ownerNameLabel")}
            placeholder={t("isp.ownerNamePlaceholder")}
          />

          <FormInput
            control={control}
            name="email"
            label={t("isp.ownerEmailLabel")}
            placeholder={t("isp.ownerEmailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormInput
            control={control}
            name="username"
            label={t("isp.ownerUsernameLabel")}
            placeholder={t("isp.ownerUsernamePlaceholder")}
            autoCapitalize="none"
          />

          <FormInput
            control={control}
            name="password"
            label={t("isp.ownerPasswordLabel")}
            placeholder={t("isp.ownerPasswordPlaceholder")}
            secureTextEntry
          />
        </View>

        <Button
          title={isSubmitting ? t("isp.creating") : t("isp.submitBtn")}
          size="lg"
          className="w-full mt-10 shadow-lg shadow-primary/20"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(uri, base64) => setSelectedLogo({ uri, base64 })}
        aspectRatio="1:1"
      />

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          setValue("lat", lat.toString());
          setValue("long", lng.toString());
          if (addressText) {
            setValue("address", addressText);
          }
        }}
        initialCoordinate={
          watch("lat") && watch("long")
            ? {
                latitude: parseFloat(watch("lat")!),
                longitude: parseFloat(watch("long")!),
              }
            : null
        }
        initialAddress={watch("address")}
      />
    </ScreenWrapper>
  );
}
