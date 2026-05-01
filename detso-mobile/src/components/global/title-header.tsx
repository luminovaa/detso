import React from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./text";
import { cn } from "../../lib/utils";
import { useT } from "@/src/features/i18n/store";

export interface TitleHeaderProps {
  type: "sticky" | "large" | "fixed";
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
  onBackPress?: () => void;
  placeholder?: string;
  rightElement?: React.ReactNode;
}

export function TitleHeader({
  type,
  title,
  subtitle,
  scrollY,
  searchQuery,
  onSearchChange,
  onFilterPress,
  onBackPress,
  placeholder,
  rightElement,
}: TitleHeaderProps) {
  const { t } = useT();
  const resolvedPlaceholder = placeholder || t("components.titleHeader.placeholder");
  // --- ANIMASI REANIMATED ---
  const stickyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 90], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [50, 90],
          [-10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    // 'auto' vs 'none' casting untuk menghindari error typescript di Reanimated 3+
    pointerEvents: (scrollY.value > 60 ? "auto" : "none") as any,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 50], [24, 0], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.value, [0, 30], [1, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(
      scrollY.value,
      [0, 50],
      [8, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // ==========================================
  // VARIAN 1: STICKY HEADER (Muncul saat discroll ke bawah)
  // ==========================================
  if (type === "sticky") {
    return (
      <Animated.View
        style={stickyStyle}
        className="absolute top-0 left-0 right-0 z-50 bg-background/95 pb-3 pt-4 border-b border-border px-6 flex-row gap-3 items-center"
      >
        {/* Search Input */}
        <View className="flex-row items-center bg-card border border-input rounded-2xl px-4 h-12 flex-1 shadow-sm">
          <Ionicons
            name="search-outline"
            size={20}
            color="#94a3b8"
            className="mr-2"
          />
          <TextInput
            placeholder={resolvedPlaceholder}
            value={searchQuery}
            onChangeText={onSearchChange}
            className="flex-1 text-foreground text-base h-full"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filter Button */}
        {onFilterPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onFilterPress}
            className="h-12 bg-primary rounded-2xl items-center justify-center px-4 flex-row shadow-sm"
          >
            <Ionicons name="options-outline" size={20} color="white" />
            <Text
              weight="semibold"
              className="text-primary-foreground ml-2 text-sm"
            >
              {t("components.titleHeader.filter")}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  // ==========================================
  // VARIAN 2: LARGE HEADER (Hero section)
  // ==========================================
  if (type === "large") {
    return (
      <View className="px-6">
        <View className="flex-row justify-between items-start mb-4 mt-2">
          {/* Title & Subtitle Area */}
          <View className="flex-1 mr-4 mb-2">
            <Text weight="bold" className="text-3xl text-foreground">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-muted-foreground mt-1">{subtitle}</Text>
            )}
          </View>

          {/* Right Action Area */}
          <View className="flex-row items-center gap-2">
            {onFilterPress && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onFilterPress}
                className={cn(
                  "h-12 bg-primary rounded-2xl items-center justify-center flex-row shadow-sm",
                  rightElement ? "w-12" : "px-4", // Bulat jika ada elemen kanan, memanjang jika tidak
                )}
              >
                <Ionicons name="options-outline" size={20} color="white" />
                {!rightElement && (
                  <Text
                    weight="semibold"
                    className="text-primary-foreground ml-2 text-sm"
                  >
                    {t("components.titleHeader.filter")}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {rightElement && <View>{rightElement}</View>}
          </View>
        </View>

        {/* Search Bar (Bawah Title) */}
        {onSearchChange && (
          <View className="flex-row items-center bg-card border border-input rounded-2xl px-4 h-12 w-full shadow-sm mb-4">
            <Ionicons
              name="search-outline"
              size={20}
              color="#94a3b8"
              className="mr-2"
            />
            <TextInput
              placeholder={resolvedPlaceholder}
              value={searchQuery}
              onChangeText={onSearchChange}
              className="flex-1 text-foreground text-base h-full"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}
      </View>
    );
  }

  // ==========================================
  // VARIAN 3: FIXED HEADER (Top bar diam untuk halaman detail)
  // ==========================================
  if (type === "fixed") {
    return (
      <View className="bg-background py-2 px-6 z-50">
        <View className="flex-row items-center justify-between mb-2">
          {/* Back Button & Title */}
          <View className="flex-row items-center flex-1">
            {onBackPress && (
              <TouchableOpacity
                onPress={onBackPress}
                className="mr-2 h-10 w-10 items-center justify-center -ml-2 rounded-full active:bg-muted"
              >
                {/* Gunakan warna foreground agar dinamis di dark/light mode */}
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color="var(--foreground)"
                  className="text-foreground"
                />
              </TouchableOpacity>
            )}
            <Text
              weight="bold"
              className="text-3xl text-foreground flex-1"
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          {/* Right Action Area */}
          <View className="flex-row items-center gap-2">
            {onFilterPress && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onFilterPress}
                className={cn(
                  "h-12 bg-primary rounded-2xl items-center justify-center flex-row shadow-sm",
                  rightElement ? "w-12" : "px-4",
                )}
              >
                <Ionicons name="options-outline" size={20} color="white" />
                {!rightElement && (
                  <Text
                    weight="semibold"
                    className="text-primary-foreground ml-2 text-sm"
                  >
                    {t("components.titleHeader.filter")}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {rightElement && <View>{rightElement}</View>}
          </View>
        </View>

        {/* Animated Subtitle (Akan hilang saat di-scroll) */}
        {subtitle && (
          <Animated.View style={subtitleStyle} className="overflow-hidden">
            <Text className="text-muted-foreground -mt-1">{subtitle}</Text>
          </Animated.View>
        )}

        {/* Search Bar */}
        {onSearchChange && (
          <View className="flex-row items-center bg-card border border-input rounded-2xl px-4 h-12 w-full shadow-sm mt-1">
            <Ionicons
              name="search-outline"
              size={20}
              color="#94a3b8"
              className="mr-2"
            />
            <TextInput
              placeholder={resolvedPlaceholder}
              value={searchQuery}
              onChangeText={onSearchChange}
              className="flex-1 text-foreground text-base h-full"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}
      </View>
    );
  }

  return null;
}
