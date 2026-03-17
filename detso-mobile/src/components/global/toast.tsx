import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

// Import komponen internal kita
import { Portal } from "./portal";
import { Text } from "./text";
import { cn } from "../../lib/utils";

// Import tipe dan hook yang sudah dipisah
import { useToast, ToastProps } from "../../hooks/use-toast";

// --- KOMPONEN ITEM TOAST ---
const ToastItem = ({
  item,
  onDismiss,
}: {
  item: ToastProps;
  onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration || 3000);

    return () => clearTimeout(timer);
  }, [item, onDismiss]);

  const config = {
    default: {
      icon: "information-circle",
      color: "#3b82f6",
      bg: "bg-card border-border",
    },
    success: {
      icon: "checkmark-circle",
      color: "#10b981",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    destructive: {
      icon: "alert-circle",
      color: "#ef4444",
      bg: "bg-destructive border-destructive",
    },
    warning: {
      icon: "warning",
      color: "#f59e0b",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
  };

  const current = config[item.type || "default"];

  return (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className={cn(
        "flex-row items-start p-4 mb-3 rounded-2xl border shadow-lg w-full max-w-sm",
        current.bg,
        item.type === "destructive"
          ? "shadow-destructive/20"
          : "shadow-black/5",
      )}
    >
      <Ionicons
        name={current.icon as any}
        size={24}
        color={item.type === "destructive" ? "#ffffff" : current.color}
        className="mr-3 mt-0.5"
      />
      <View className="flex-1 mr-2">
        <Text
          weight="semibold"
          className={cn(
            "text-base mb-0.5",
            item.type === "destructive"
              ? "text-destructive-foreground"
              : "text-foreground",
          )}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text
            className={cn(
              "text-sm",
              item.type === "destructive"
                ? "text-destructive-foreground/90"
                : "text-muted-foreground",
            )}
          >
            {item.description}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => onDismiss(item.id)}
        activeOpacity={0.7}
        className="p-1"
      >
        <Ionicons
          name="close"
          size={20}
          color={item.type === "destructive" ? "#ffffff" : "#64748b"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- KOMPONEN VIEWPORT (Wadah Render) ---
export const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  return (
    <Portal>
      {/* SafeArea & Positioning */}
      <View
        className="absolute top-14 left-0 right-0 z-50 px-6 items-center"
        pointerEvents="box-none"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </View>
    </Portal>
  );
};
