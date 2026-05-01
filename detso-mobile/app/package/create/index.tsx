import React, { useState } from "react";
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
import { SpeedUnitToggle, SpeedUnit } from "@/src/components/global/speed-unit-toggle";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { createPackageSchema, CreatePackageInput } from "@/src/features/package/schema";
import { useCreatePackage } from "@/src/features/package/hooks";

export default function PackageCreateScreen() {
  const { t } = useT();
  const createPackage = useCreatePackage();
  const isSubmitting = createPackage.isPending;
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("Mbps");

  const { control, handleSubmit } = useForm<CreatePackageInput>({
    resolver: zodResolver(createPackageSchema) as any,
    defaultValues: {
      name: "",
      speed: "",
      price: undefined,
    },
  });

  const onSubmit = (data: CreatePackageInput) => {
    // Combine speed value + unit → "100 Mbps"
    const payload = {
      ...data,
      speed: data.speed ? `${data.speed} ${speedUnit}` : "",
    };
    createPackage.mutate(payload, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("package.createTitle")} showBackButton>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-y-3">
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
              placeholder="100"
              keyboardType="numeric"
              suffixComponent={
                <SpeedUnitToggle value={speedUnit} onChange={setSpeedUnit} />
              }
            />

            <FormInput
              control={control}
              name="price"
              label={t("package.priceLabel")}
              placeholder={t("package.pricePlaceholder")}
              keyboardType="numeric"
              isCurrency
            />
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? t("package.creating") : t("package.submitBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}