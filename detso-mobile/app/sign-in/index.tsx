import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS === "android"
    ? (StatusBar.currentHeight || 24)
    : insets.top;

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
    <View className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Hero Section - sama seperti Header di dashboard */}
          <View 
            className="bg-primary px-6 pb-20"
            style={{ paddingTop: statusBarHeight + 150 }}
          >
            <View className="items-center">
              <View className="w-28 h-28 rounded-[32px] bg-white/15 border border-white/25 items-center justify-center mb-5">
                <Image
                  source={require("@/assets/images/icon.png")}
                  className="w-20 h-20"
                  resizeMode="contain"
                />
              </View>
              <Text weight="bold" className="text-4xl tracking-tight text-center text-white">
                {t("auth.welcome")}
              </Text>
              <Text className="text-white/85 text-center mt-3 text-base px-4 leading-relaxed">
                {t("auth.subtitle")}
              </Text>
            </View>
          </View>

          {/* Form Section - overlap ke atas seperti content di dashboard */}
          <View 
            className="flex-1 bg-background rounded-t-[34px] mt-24 px-6 pt-10"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="gap-3 mt-2">
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
                    className="h-[62px] rounded-2xl"
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
                    className="h-[62px] rounded-2xl"
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

            <View className="mt-auto pt-8 pb-4 flex-row justify-center items-center">
              <Text className="text-muted-foreground mr-1.5 text-base">
                {t("auth.needHelp")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/register" as any)}>
                <Text weight="bold" className="text-primary text-base">
                  {t("auth.contactAdmin")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
