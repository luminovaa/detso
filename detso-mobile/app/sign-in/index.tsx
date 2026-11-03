import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Platform,
  Image,
  StatusBar,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/src/components/global/text";
import { Input } from "@/src/components/global/input";
import { Button } from "@/src/components/global/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/global/dialog";

import { loginSchema, LoginInput } from "@/src/features/auth/schema";
import { useAuthStore } from "@/src/features/auth/store";
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { useThemeColor } from "@/src/lib/theme-colors";

const formatCountdown = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function SignInScreen() {
  const { t } = useT();
  const locale = useLanguageStore((state) => state.locale);
  const setLocale = useLanguageStore((state) => state.setLocale);
  const login = useAuthStore((state) => state.login);
  const colors = useThemeColor();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState<"rate_limit" | "network" | "auth" | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const interval = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev <= 1) {
          setErrorType((current) => (current === "rate_limit" ? null : current));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfterSeconds]);

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
    if (retryAfterSeconds > 0) return;

    setErrorType(null);
    setIsLoading(true);
    try {
      await login(data);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const err = error as {
        statusCode?: number;
        response?: { status?: number; headers?: Record<string, string | undefined> };
      };
      const status = err?.statusCode ?? err?.response?.status;

      if (status === 429) {
        const headerVal =
          err?.response?.headers?.["retry-after"] ?? err?.response?.headers?.["Retry-After"];
        const retrySec = parseInt(headerVal ?? "300", 10) || 300;
        setRetryAfterSeconds(retrySec);
        setErrorType("rate_limit");
      } else if (!err?.response && !err?.statusCode) {
        setErrorType("network");
      } else {
        setErrorType("auth");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable className="flex-1 bg-background" onPress={Keyboard.dismiss}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 24,
          }}
        >
          {/* Top Row */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="h-11 px-2.5 rounded-lg bg-white border border-border items-center justify-center">
              <Image
                source={require("@/assets/images/logo-dts.png")}
                className="w-[84px] h-[36px]"
                resizeMode="contain"
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("auth.languageToggle")}
              onPress={() => setLocale(locale === "id" ? "en" : "id")}
              className="min-h-11 px-3 border border-border rounded-lg flex-row items-center justify-center"
            >
              <Text weight="semibold" className="text-xs text-foreground">
                {locale === "id" ? "ID · EN" : "EN · ID"}
              </Text>
            </Pressable>
          </View>

          {/* Editorial Header */}
          <View className="mb-6">
            <Text
              weight="bold"
              className="text-primary text-xs uppercase tracking-widest mb-2"
            >
              {t("auth.eyebrow")}
            </Text>
            <Text
              weight="bold"
              className="text-3xl font-sf-bold text-foreground mb-1.5"
            >
              {t("auth.welcome")}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {t("auth.subtitle")}
            </Text>
          </View>

          {/* Inline Error / Rate-Limit Banner */}
          {errorType === "rate_limit" ? (
            <View
              className="rounded-xl p-3 flex-row items-center gap-2.5 mb-4 border"
              style={{
                backgroundColor: `${colors.warning}1A`,
                borderColor: `${colors.warning}40`,
              }}
            >
              <Ionicons name="time-outline" size={18} color={colors.warning} />
              <Text className="text-sm flex-1 text-foreground">
                {t("auth.rateLimitedTitle", { seconds: retryAfterSeconds })} (
                {formatCountdown(retryAfterSeconds)})
              </Text>
            </View>
          ) : errorType === "network" || errorType === "auth" ? (
            <View className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex-row items-center gap-2.5 mb-4">
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text className="text-destructive text-sm flex-1">
                {errorType === "network"
                  ? t("auth.networkErrorTitle")
                  : t("auth.loginFailedTitle")}
              </Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View className="gap-4 mb-6">
            <View>
              <Text
                weight="medium"
                className="text-sm text-muted-foreground mb-1.5"
              >
                {t("auth.identifierLabel")}
              </Text>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t("auth.emailPlaceholder")}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading && retryAfterSeconds === 0}
                    error={errors.identifier?.message}
                  />
                )}
              />
            </View>

            <View>
              <Text
                weight="medium"
                className="text-sm text-muted-foreground mb-1.5"
              >
                {t("auth.passwordLabel")}
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t("auth.passwordPlaceholder")}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    isPassword
                    editable={!isLoading && retryAfterSeconds === 0}
                    error={errors.password?.message}
                  />
                )}
              />
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={t("auth.loginBtn")}
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            disabled={isLoading || retryAfterSeconds > 0}
            size="lg"
            className="w-full"
          />

          {/* Footer Admin-Help Card */}
          <View className="mt-auto pt-8">
            <View className="rounded-xl bg-muted p-4 flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text weight="semibold" className="text-sm text-foreground">
                  {t("auth.helpTitle")}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {t("auth.helpDesc")}
                </Text>
              </View>
              <Pressable
                onPress={() => setHelpOpen(true)}
                className="min-h-11 px-3 items-center justify-center rounded-lg border border-border bg-card"
              >
                <Text weight="semibold" className="text-xs text-primary">
                  {t("auth.helpAction")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.contactAdmin")}</DialogTitle>
            <DialogDescription>{t("auth.helpDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              title={t("common.cancel")}
              variant="outline"
              size="sm"
              onPress={() => setHelpOpen(false)}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Pressable>
  );
}
