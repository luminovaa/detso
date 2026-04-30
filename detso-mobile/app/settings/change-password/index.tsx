import React, { useState, useEffect } from "react";
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
import { FormSkeleton } from "@/src/components/global/form-skeleton";

// --- Store & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { updatePasswordSchema, UpdatePasswordInput } from "@/src/features/user/schema";
import { useUpdatePassword } from "@/src/features/user/hooks";

export default function ChangePasswordScreen() {
  const { t } = useT();
  const { logout } = useAuthStore();
  const updatePassword = useUpdatePassword();
  const isSubmitting = updatePassword.isPending;
  const [isInitializing, setIsInitializing] = useState(true);

  // Initial loading effect
  useEffect(() => {
    setTimeout(() => setIsInitializing(false), 500);
  }, []);

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

  const onSubmit = (data: UpdatePasswordInput) => {
    updatePassword.mutate(data, {
      onSuccess: () => {
        showToast.success(
          t("common.success"),
          t("settings.security.passwordChangeSuccess")
        );
        // Logout otomatis setelah berhasil
        setTimeout(async () => {
          await logout();
        }, 1500);
      },
    });
  };

  if (isInitializing) {
    return (
      <ScreenWrapper 
        headerTitle={t("settings.security.changePassword")} 
        showBackButton
        isLoading={true}
      >
        <FormSkeleton fieldCount={3} />
      </ScreenWrapper>
    );
  }

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
