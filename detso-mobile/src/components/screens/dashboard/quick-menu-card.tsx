import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { useThemeColor } from "@/src/lib/theme-colors";

interface QuickMenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export const QuickMenuCard = React.memo(function QuickMenuCard({
  icon,
  label,
  onPress,
}: QuickMenuCardProps) {
  const colors = useThemeColor();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 bg-card rounded-2xl py-3.5 px-2 border border-border items-center justify-center"
    >
      <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mb-2">
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>
      <Text weight="semibold" className="text-xs text-foreground text-center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});
