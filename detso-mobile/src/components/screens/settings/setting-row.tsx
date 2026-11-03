import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { cn } from "@/src/lib/utils";

import { useThemeColor } from "@/src/lib/theme-colors";
interface SettingRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  rightNode?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  value?: string;
  destructive?: boolean;
}

export function SettingRow({
  label,
  iconName,
  iconBgColor = "bg-primary/10",
  iconColor,
  rightNode,
  onPress,
  isLast = false,
  value,
  destructive = false,
}: SettingRowProps) {
  const colors = useThemeColor();
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      className={cn(
        "flex-row items-center justify-between p-4 gap-3",
        !isLast && "border-b border-border/60"
      )}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className={cn("w-10 h-10 rounded-xl items-center justify-center", iconBgColor)}>
          <Ionicons 
            name={iconName} 
            size={20} 
            color={destructive ? colors.error : colors.primary}
            className={destructive ? "text-destructive" : iconColor || "text-primary"}
          />
        </View>
        <Text weight="semibold" className={cn("text-base", destructive ? "text-destructive" : "text-foreground")}>
          {label}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        {value && (
          <Text weight="bold" className="text-primary mr-2 uppercase">
            {value}
          </Text>
        )}
        {rightNode || (
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={destructive ? colors.error : colors.primary} 
            style={destructive ? { opacity: 0.5 } : {}}
          />
        )}
      </View>
    </Container>
  );
}

interface SelectionItemProps {
  label: string;
  isActive: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  onSelect: () => void;
  isLast?: boolean;
}

export function SelectionItem({
  label,
  isActive,
  iconName,
  onSelect,
  isLast = false,
}: SelectionItemProps) {
  const colors = useThemeColor();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      className={cn(
        "flex-row items-center justify-between p-4 gap-3",
        !isLast && "border-b border-border/60"
      )}
    >
      <View className="flex-row items-center gap-3">
        {iconName && (
          <View className="w-8 h-8 rounded-lg bg-muted items-center justify-center">
            <Ionicons
              name={iconName}
              size={16}
              color={isActive ? colors.primary : colors.textMuted}
              className={isActive ? "text-primary" : "text-muted-foreground"}
            />
          </View>
        )}
        <Text
          weight={isActive ? "bold" : "medium"}
          className={cn("text-base", isActive ? "text-primary" : "text-foreground")}
        >
          {label}
        </Text>
      </View>
      {isActive && (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}
