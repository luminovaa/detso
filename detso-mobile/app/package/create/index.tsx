import React from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { showToast } from "@/src/components/global/toast";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { createPackageSchema, CreatePackageInput } from "@/src/features/package/schema";
import { useCreatePackage } from "@/src/features/package/hooks";

export default function PackageCreateScreen() {
  const { t } = useT();
  const createPackage = useCreatePackage();
  const isSubmitting = createPackage.isPending;

  const { control, handleSubmit } = useForm<CreatePackageInput>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      name: "",
      speed: "",
      price: undefined,
    },
  });

  const onSubmit = (data: CreatePackageInput) => {
    createPackage.mutate(data, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("package.createTitle")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-5">
          <FormInput
            control={control}
            name="name"
            label={t("package.nameLabel")}
            placeholder={t("package.namePlaceholder")}
          />

          <FormInput
            control={control}
            name="speed"
            label={t("package.speedLabel")}
            placeholder={t("package.speedPlaceholder")}
          />

          <FormInput
            control={control}
            name="price"
            label={t("package.priceLabel")}
            placeholder={t("package.pricePlaceholder")}
            keyboardType="numeric"
          />
        </View>

        <Button
          title={isSubmitting ? t("package.creating") : t("package.submitBtn")}
          size="lg"
          className="w-full mt-10 shadow-lg shadow-primary/20"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}