import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { Text } from "@/src/components/global/text";
import { Input } from "@/src/components/global/input";
import { Button } from "@/src/components/global/button";

import { loginSchema, LoginInput } from "@/src/features/auth/schema";
import { useAuthStore } from "@/src/features/auth/store";
import { useT } from "@/src/features/i18n/store";

export default function SignInScreen() {
  const { t } = useT();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data);
      router.replace("/");
    } catch (error: any) {
      console.error("Login Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="px-8"
        >
          {/* Header Section: iOS Style Branding */}
          <View className="mt-20 mb-12 items-center">
            <View className="w-24 h-24 rounded-[28px] bg-primary/10 items-center justify-center mb-8 shadow-sm">
                <Image 
                    source={require("@/assets/images/icon.png")} 
                    className="w-16 h-16"
                    resizeMode="contain"
                />
            </View>
            <Text weight="bold" className="text-4xl tracking-tight text-center">
              {t("auth.welcome")}
            </Text>
            <Text className="text-muted-foreground text-center mt-3 text-lg px-4 leading-relaxed">
              {t("auth.subtitle")}
            </Text>
          </View>

          {/* Form Section */}
          <View className="flex-1">
            <View className="gap-2">
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t("auth.emailPlaceholder")}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.identifier?.message}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="h-16 rounded-2xl"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t("auth.passwordPlaceholder")}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    isPassword
                    className="h-16 rounded-2xl"
                  />
                )}
              />
            </View>

            <TouchableOpacity className="self-end mt-1 mb-10">
              <Text weight="semibold" className="text-primary text-[15px]">
                {t("auth.forgotPassword")}
              </Text>
            </TouchableOpacity>

            <Button
              title={t("auth.loginBtn")}
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              size="lg"
              className="w-full shadow-lg shadow-primary/20"
            />
          </View>

          <View className="mt-auto mb-10 pt-8 pb-4 flex-row justify-center items-center">
            <Text className="text-muted-foreground mr-1.5 text-base">
              {t("auth.needHelp")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text weight="bold" className="text-primary text-base">
                {t("auth.contactAdmin")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}