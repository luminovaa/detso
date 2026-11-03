import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { SpeedUnitToggle, SpeedUnit } from "@/src/components/global/speed-unit-toggle";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { updatePackageSchema, UpdatePackageInput } from "@/src/features/package/schema";
import { usePackage, useUpdatePackage } from "@/src/features/package/hooks";

import { useThemeColor } from "@/src/lib/theme-colors";
interface PackageData {
  id: string;
  name: string;
  speed: string;
  price: number;
}

/**
 * Parse speed string ke value + unit
 * "100 Mbps" → { value: "100", unit: "Mbps" }
 * "1 Gbps"   → { value: "1", unit: "Gbps" }
 * "50"       → { value: "50", unit: "Mbps" }
 */
function parseSpeed(speed: string): { value: string; unit: SpeedUnit } {
  if (!speed) return { value: "", unit: "Mbps" };
  const match = speed.match(/^(\d+)\s*(Gbps|Mbps)?$/i);
  if (match) {
    const unit = match[2]?.toLowerCase() === "gbps" ? "Gbps" : "Mbps";
    return { value: match[1], unit };
  }
  // Fallback: return raw value with default unit
  const numOnly = speed.replace(/\D/g, "");
  return { value: numOnly, unit: "Mbps" };
}

export default function PackageEditScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("Mbps");
  
  const { data: response, isLoading: isLoadingData } = usePackage(id!);
  const packageData = response?.data as PackageData | undefined;

  const updatePackage = useUpdatePackage();
  const isSubmitting = updatePackage.isPending;

  const { control, handleSubmit, setValue } = useForm<UpdatePackageInput>({
    resolver: zodResolver(updatePackageSchema) as any,
    defaultValues: {
      name: "",
      speed: "",
      price: undefined,
    },
  });

  useEffect(() => {
    if (packageData) {
      setValue("name", packageData.name);
      setValue("price", packageData.price);

      // Parse speed: "100 Mbps" → value: "100", unit: "Mbps"
      const parsed = parseSpeed(packageData.speed);
      setValue("speed", parsed.value);
      setSpeedUnit(parsed.unit);
    }
  }, [packageData, setValue]);

  const onSubmit = (data: UpdatePackageInput) => {
    // Combine speed value + unit → "100 Mbps"
    const payload = {
      ...data,
      name: data.name || undefined,
      speed: data.speed ? `${data.speed} ${speedUnit}` : undefined,
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("package.editTitle")} showBackButton>
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
              {t("package.editTitle")}
            </Text>
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
          </Card>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="pt-3 pb-2 border-t border-border/10 bg-background"
        >
          <Button
            title={isSubmitting ? t("package.updating") : t("package.saveBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
