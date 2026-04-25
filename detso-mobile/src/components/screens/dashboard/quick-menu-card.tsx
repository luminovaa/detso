// src/components/screens/dashboard/quick-menu-card.tsx
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { useColorScheme } from "nativewind";

interface QuickMenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export function QuickMenuCard({ icon, label, onPress }: QuickMenuCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 bg-card rounded-2xl p-4 border border-border items-center justify-center"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View 
        className="w-12 h-12 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: isDark ? "rgba(102, 163, 255, 0.15)" : "rgba(16, 42, 77, 0.1)" }}
      >
        <Ionicons 
          name={icon} 
          size={24} 
          color={isDark ? "#66a3ff" : "#102a4d"} 
        />
      </View>
      <Text weight="semibold" className="text-xs text-foreground text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
