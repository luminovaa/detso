import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  StatusBar,
  Keyboard,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

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
  const { height: screenHeight } = useWindowDimensions();

  const statusBarHeight = Platform.OS === "android"
    ? (StatusBar.currentHeight || 24)
    : insets.top;

  // ─── Reanimated: Keyboard Animation ─────────────────────────────
  const keyboardProgress = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const keyboardHeight = e.endCoordinates.height;
      // Form naik sebesar ~60% dari keyboard height agar input terlihat
      const translateAmount = keyboardHeight * 0.6;

      keyboardProgress.value = withTiming(translateAmount, {
        duration: Platform.OS === "ios" ? 280 : 220,
        easing: Easing.out(Easing.cubic),
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardProgress.value = withTiming(0, {
        duration: Platform.OS === "ios" ? 250 : 200,
        easing: Easing.in(Easing.cubic),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Form section: naik (translateY negatif) saat keyboard muncul
  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardProgress.value }],
  }));

  // Hero section: sedikit fade out saat form naik menutupinya
  const heroAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      keyboardProgress.value,
      [0, 150],
      [1, 0.3],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // ─── Form Logic ─────────────────────────────────────────────────
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
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-primary">
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Hero Section - TETAP DI POSISI, fade saat keyboard muncul */}
        <Animated.View
          style={[{ paddingTop: statusBarHeight + 150 }, heroAnimatedStyle]}
          className="bg-primary px-6 pb-40"
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
        </Animated.View>

        {/* Form Section - NAIK saat keyboard muncul, menutupi hero */}
        <Animated.View
          style={[
            {
              flex: 1,
              minHeight: screenHeight * 0.5,
            },
            formAnimatedStyle,
          ]}
          className="bg-background rounded-t-[34px] px-6 pt-10"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
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
          </ScrollView>
        </Animated.View>
      </View>
    </Pressable>
  );
}
