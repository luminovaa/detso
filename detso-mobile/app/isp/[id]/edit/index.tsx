import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Header } from "@/src/components/global/header";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Avatar } from "@/src/components/global/avatar";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { Label } from "@/src/components/global/label";
import { showToast } from "@/src/components/global/toast";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { tenantService } from "@/src/features/tenant/service";
import {
  updateTenantSchema,
  UpdateTenantInput,
} from "@/src/features/tenant/schema";
import { Tenant } from "@/src/lib/types";

export default function ISPEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<UpdateTenantInput>({
      resolver: zodResolver(updateTenantSchema),
    });

  const isActive = watch("is_active");

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const response = await tenantService.getById(id);
        const data = response.data;
        setTenant(data);
        reset({
          name: data.name,
          address: data.address || "",
          phone: data.phone || "",
          is_active: data.is_active,
        });
      } catch (error) {
        console.error("Fetch ISP edit data error:", error);
        showToast.error(t("common.error"), t("common.error"));
      } finally {
        setIsFetching(false);
      }
    };

    fetchDetail();
  }, [id, reset, t]);

  const onSubmit = async (data: UpdateTenantInput) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      formData.append("address", data.address || "");
      formData.append("phone", data.phone || "");
      if (data.is_active !== undefined) {
        formData.append("is_active", String(data.is_active));
      }

      if (selectedLogo) {
        const uri = selectedLogo.uri;
        const uriParts = uri.split(".");
        const extension = uriParts[uriParts.length - 1].toLowerCase();
        const mimeType = extension === "jpg" ? "jpeg" : extension;

        // @ts-ignore
        formData.append("image", {
          uri: uri,
          name: `logo-update-${Date.now()}.${extension}`,
          type: `image/${mimeType}`,
        });
      }

      await tenantService.update(id, formData);
      showToast.success(t("common.success"), t("isp.successUpdate"));
      router.back();
    } catch (error: any) {
      console.error("Update ISP error:", error);
      showToast.error(
        t("common.error"),
        error.response?.data?.message || t("common.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <ScreenWrapper>
        <Header title={t("isp.editTitle")} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="hsl(var(--primary))" />
          <Text className="mt-4 text-muted-foreground">
            {t("isp.fetchingData")}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title={t("isp.editTitle")} showBackButton />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="p-6 border-border/40">
          {/* Logo Section */}
          <View className="items-center mb-10">
            <TouchableOpacity
              onPress={() => setShowImagePicker(true)}
              activeOpacity={0.7}
              className="relative"
            >
              <View className="p-1 rounded-[45px] border-2 border-dashed border-primary/30">
                <Avatar
                  src={selectedLogo?.uri || tenant?.logo}
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
          </View>

          {/* Form Fields */}
          <View className="gap-y-5">
            <FormInput
              control={control}
              name="name"
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

            <FormInput
              control={control}
              name="address"
              label={t("isp.addressLabel")}
              placeholder={t("isp.addressPlaceholder")}
              isTextarea
              numberOfLines={3}
            />

            {/* Active Status Switch */}
            <View className="flex-row items-center justify-between py-4 border-t border-border/40 mt-2">
              <View>
                <Label className="mb-0">{t("isp.isActiveLabel")}</Label>
                <Text className="text-[12px] text-muted-foreground mt-1">
                  {isActive ? t("isp.active") : t("isp.inactive")}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={(val) => setValue("is_active", val)}
                trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                thumbColor={isActive ? "#3b82f6" : "#94a3b8"}
              />
            </View>
          </View>

          <Button
            title={isSubmitting ? t("isp.updating") : t("isp.saveBtn")}
            className="mt-10 h-14 rounded-2xl"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </Card>
      </ScrollView>

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(uri, base64) => setSelectedLogo({ uri, base64 })}
        aspectRatio="1:1"
      />
    </ScreenWrapper>
  );
}
