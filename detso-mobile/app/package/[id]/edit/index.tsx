import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { showToast } from "@/src/components/global/toast";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { packageService } from "@/src/features/package/service";
import { updatePackageSchema, UpdatePackageInput } from "@/src/features/package/schema";
import { useMutation } from "@/src/hooks/use-async";
import { showErrorToast } from "@/src/lib/api-error";

interface PackageData {
  id: string;
  name: string;
  speed: string;
  price: number;
}

export default function PackageEditScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { mutate, isLoading: isSubmitting } = useMutation();

  const { control, handleSubmit, setValue } = useForm<UpdatePackageInput>({
    resolver: zodResolver(updatePackageSchema),
    defaultValues: {
      name: "",
      speed: "",
      price: undefined,
    },
  });

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await packageService.getById(id);
        const data = response.data;
        setValue("name", data.name);
        setValue("speed", data.speed);
        setValue("price", data.price);
      } catch (error) {
        showErrorToast(error, t("common.loadFailed"));
        router.back();
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchPackage();
    }
  }, [id, setValue, t]);

  const onSubmit = async (data: UpdatePackageInput) => {
    const payload = {
      ...data,
      name: data.name || undefined,
      speed: data.speed || undefined,
    };

    await mutate(
      () => packageService.update(id, payload),
      {
        onSuccess: () => {
          showToast.success(t("common.success"), t("package.successUpdate"));
          router.back();
        },
        toastTitle: t("common.error"),
      },
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
