import React, { useEffect } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { updatePackageSchema, UpdatePackageInput } from "@/src/features/package/schema";
import { usePackage, useUpdatePackage } from "@/src/features/package/hooks";

interface PackageData {
  id: string;
  name: string;
  speed: string;
  price: number;
}

export default function PackageEditScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: response, isLoading: isLoadingData } = usePackage(id!);
  const packageData = response?.data as PackageData | undefined;

  const updatePackage = useUpdatePackage();
  const isSubmitting = updatePackage.isPending;

  const { control, handleSubmit, setValue } = useForm<UpdatePackageInput>({
    resolver: zodResolver(updatePackageSchema),
    defaultValues: {
      name: "",
      speed: "",
      price: undefined,
    },
  });

  useEffect(() => {
    if (packageData) {
      setValue("name", packageData.name);
      setValue("speed", packageData.speed);
      setValue("price", packageData.price);
    }
  }, [packageData, setValue]);

  const onSubmit = (data: UpdatePackageInput) => {
    const payload = {
      ...data,
      name: data.name || undefined,
      speed: data.speed || undefined,
    };

    updatePackage.mutate(
      { id: id!, data: payload },
      { onSuccess: () => router.back() },
    );
  };

  if (isLoadingData) {
    return (
      <ScreenWrapper headerTitle={t("package.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="hsl(var(--primary))" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("package.editTitle")} showBackButton>
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
          title={isSubmitting ? t("package.updating") : t("package.saveBtn")}
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
