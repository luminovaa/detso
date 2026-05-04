// src/components/screens/dashboard/quick-menu-card.tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { useColorScheme } from "nativewind";
import { getColor } from "@/src/lib/colors";

interface QuickMenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export const QuickMenuCard = React.memo(function QuickMenuCard({ icon, label, onPress }: QuickMenuCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const iconColor = getColor('brand.primary', isDark);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 bg-card rounded-2xl p-4 border border-border items-center justify-center"
      
    >
      <Ionicons 
        name={icon} 
        size={28} 
        color={iconColor}
        style={{ marginBottom: 8 }}
      />
      <Text weight="semibold" className="text-xs text-foreground text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
});
