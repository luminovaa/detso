import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { FormInput } from "@/src/components/global/form-input";
import { Button } from "@/src/components/global/button";
import { Text } from "@/src/components/global/text";
import { showToast } from "@/src/components/global/toast";

// --- Store & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { userService } from "@/src/features/user/service";
import { updatePasswordSchema, UpdatePasswordInput } from "@/src/features/user/schema";
import { useMutation } from "@/src/hooks/use-async";

export default function ChangePasswordScreen() {
  const { t } = useT();
  const { logout } = useAuthStore();
  const { mutate, isLoading: isSubmitting } = useMutation();

  // --- React Hook Form dengan Zod Resolver ---
  const {
    control,
    handleSubmit,
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: UpdatePasswordInput) => {
    await mutate(
      () => userService.updatePassword(data),
      {
        onSuccess: () => {
          showToast.success(
            t("common.success"),
            "Kata sandi berhasil diubah. Silakan login kembali."
          );
          // Logout otomatis setelah berhasil
          setTimeout(async () => {
            await logout();
          }, 1500);
        },
        toastTitle: t("common.error"),
      },
    );
  };

  return (
    <ScreenWrapper headerTitle={t("settings.security.changePassword")} showBackButton>

      <ScrollView
        className="flex-1 px-4 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-muted-foreground mb-8">
          {t("settings.security.useStrongPassword")}
        </Text>

        <View className="gap-y-2">
          <FormInput
            control={control}
            name="oldPassword"
            label={t("settings.security.oldPasswordLabel")}
            placeholder={t("settings.security.oldPasswordPlaceholder")}
            isPassword
          />

          <View className="h-px bg-border/50 my-4" />

          <FormInput
            control={control}
            name="password"
            label={t("settings.security.newPasswordLabel")}
            placeholder={t("settings.security.newPasswordPlaceholder")}
            isPassword
          />

          <FormInput
            control={control}
            name="confirmPassword"
            label={t("settings.security.confirmPasswordLabel")}
            placeholder={t("settings.security.confirmPasswordPlaceholder")}
            isPassword
          />
        </View>

        <View className="mt-10 gap-y-4">
          <Button
            title={t("settings.security.savePasswordBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
          <Button
            title={t("common.cancel")}
            variant="outline"
            size="lg"
            className="w-full"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
        </View>

        <View className="mt-12 p-5 bg-primary/5 rounded-3xl border border-primary/10">
          <View className="flex-row items-center mb-2 justify-center">
            <Text weight="bold" className="text-primary text-xs uppercase tracking-widest">
              {t("settings.security.securityTitle")}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground leading-5 text-center">
            {t("settings.security.passwordChangeWarning")}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

