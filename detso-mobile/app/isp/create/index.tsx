import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Header } from "@/src/components/global/header";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Avatar } from "@/src/components/global/avatar";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { showToast } from "@/src/components/global/toast";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { tenantService } from "@/src/features/tenant/service";
import {
  createTenantSchema,
  CreateTenantInput,
} from "@/src/features/tenant/schema";

export default function ISPCreateScreen() {
  const { t } = useT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  const onSubmit = async (data: CreateTenantInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("address", data.address || "");
      formData.append("phone", data.phone || "");

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

      await tenantService.create(formData);
      showToast.success(t("common.success"), t("isp.successCreate"));
      router.back();
    } catch (error: any) {
      console.error("Create ISP error:", error);
      showToast.error(
        t("common.error"),
        error.response?.data?.message || t("common.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title={t("isp.createTitle")} showBackButton />

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
            Tap untuk memilih logo
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
        </View>

        <Button
          title={isSubmitting ? t("isp.creating") : t("isp.submitBtn")}
          className="mt-10 h-14 rounded-2xl"
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
    </ScreenWrapper>
  );
}
