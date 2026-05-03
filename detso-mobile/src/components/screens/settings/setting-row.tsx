import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { cn } from "@/src/lib/utils";

import { COLORS } from '@/src/lib/colors';
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
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      className={cn(
        "flex-row items-center justify-between p-4",
        !isLast && "border-b border-border"
      )}
    >
      <View className="flex-row items-center">
        <View className={cn("w-10 h-10 rounded-xl items-center justify-center mr-4", iconBgColor)}>
          <Ionicons 
            name={iconName} 
            size={20} 
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
            color={destructive ? COLORS.status.error : COLORS.brand.primary} 
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
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      className={cn(
        "flex-row items-center justify-between p-4",
        !isLast && "border-b border-border"
      )}
    >
      <View className="flex-row items-center">
        {iconName && (
          <View className="w-8 h-8 rounded-lg bg-muted items-center justify-center mr-3">
            <Ionicons
              name={iconName}
              size={16}
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
        <Ionicons name="checkmark-circle" size={22} color={COLORS.brand.primary} />
      )}
    </TouchableOpacity>
  );
}
