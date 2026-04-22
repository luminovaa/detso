import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../text"; // Pastikan path ini mengarah ke komponen Text global kamu

interface ToastContentProps {
  toast: {
    id: string;
    title: string;
    message?: string;
    type: "success" | "error" | "info" | "warning";
  };
  onPress?: () => void;
  duration: number;
}

// 🎨 DISESUAIKAN DENGAN TEMA TAILWIND KAMU
const TYPE_CONFIG = {
  success: {
    icon: "checkmark-circle" as const,
    iconColor: "#10B981", // Emerald
    bgClass: "border-emerald-500/50",
  },
  error: {
    icon: "alert-circle" as const,
    iconColor: "#EF4444", // Destructive
    bgClass: "border-destructive/50",
  },
  warning: {
    icon: "warning" as const,
    iconColor: "#F59E0B", // Amber
    bgClass: "border-amber-500/50",
  },
  info: {
    icon: "information-circle" as const,
    iconColor: "#3B82F6", // Blue
    bgClass: "border-blue-500/50",
  },
};

export function ToastContent({ toast, onPress, duration }: ToastContentProps) {
  const config = TYPE_CONFIG[toast.type];
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: duration,
      useNativeDriver: true,
    }).start();
  }, [duration, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 0], 
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`flex-row items-center bg-card rounded-2xl px-4 py-4 border overflow-hidden ${config.bgClass}`}
      style={{
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }}
    >
      {/* Icon */}
      <View className="mr-3 mt-0.5">
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
      </View>

      {/* Text */}
      <View className="flex-1 mr-2">
        <Text weight="semibold" className="text-[15px] text-foreground mb-0.5">
          {toast.title}
        </Text>
        {toast.message && (
          <Text className="text-[13px] text-muted-foreground">
            {toast.message}
          </Text>
        )}
      </View>

      {/* Close Hint */}
      <Ionicons name="close" size={18} color="hsl(var(--muted-foreground))" />

      {/* Progress bar */}
      <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent">
        <Animated.View
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: config.iconColor,
            opacity: 0.8,
            transform: [{ translateX }],
          }}
        />
      </View>
    </TouchableOpacity>
  );
}