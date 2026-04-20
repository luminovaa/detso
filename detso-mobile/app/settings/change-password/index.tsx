import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Header } from "@/src/components/global/header";
import { FormInput } from "@/src/components/global/form-input";
import { Button } from "@/src/components/global/button";
import { Text } from "@/src/components/global/text";
import { showToast } from "@/src/components/global/toast";

// --- Store & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { userService } from "@/src/features/user/service";
import { updatePasswordSchema, UpdatePasswordInput } from "@/src/features/user/schema";

export default function ChangePasswordScreen() {
  const { t } = useT();
  const { logout } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      await userService.updatePassword(data);

      showToast.success(
        t("common.success"), 
        "Kata sandi berhasil diubah. Silakan login kembali."
      );

      // Logout otomatis setelah berhasil
      setTimeout(async () => {
        await logout();
      }, 1500);

    } catch (error: any) {
      console.error("Change password error:", error);
      const msg = error.response?.data?.message || "Gagal mengubah kata sandi";
      showToast.error(t("common.error"), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title={t("settings.security.changePassword")} showBackButton />

      <ScrollView 
        className="flex-1 px-4 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-muted-foreground mb-8">
          Gunakan kata sandi yang kuat dan unik untuk mengamankan akun Anda.
        </Text>

        <View className="gap-y-2">
          <FormInput
            control={control}
            name="oldPassword"
            label="Kata Sandi Lama"
            placeholder="Masukkan kata sandi saat ini"
            isPassword
          />

          <View className="h-px bg-border/50 my-4" />

          <FormInput
            control={control}
            name="password"
            label="Kata Sandi Baru"
            placeholder="Minimal 6 karakter"
            isPassword
          />

          <FormInput
            control={control}
            name="confirmPassword"
            label="Konfirmasi Kata Sandi Baru"
            placeholder="Ulangi kata sandi baru"
            isPassword
          />
        </View>

        <View className="mt-10 gap-y-4">
          <Button
            title="Simpan Kata Sandi"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
          <Button
            title={t("common.cancel")}
            variant="outline"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
        </View>

        <View className="mt-12 p-5 bg-primary/5 rounded-3xl border border-primary/10">
          <View className="flex-row items-center mb-2 justify-center">
            <Text weight="bold" className="text-primary text-xs uppercase tracking-widest">
              Keamanan Akun
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground leading-5 text-center">
            Setelah berhasil mengubah kata sandi, sesi Anda akan dihentikan dan Anda harus masuk kembali dengan kata sandi baru.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
