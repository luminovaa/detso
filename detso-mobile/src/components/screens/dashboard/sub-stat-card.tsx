import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/global/text";

export interface SubStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  dotColor: string;
}

export function SubStatCard({ label, value, hint, dotColor }: SubStatCardProps) {
  return (
    <View className="flex-1 bg-card border border-border rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-xs text-muted-foreground flex-1 mr-1" numberOfLines={1}>
          {label}
        </Text>
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      </View>

      <Text weight="bold" className="text-2xl font-sf-bold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>

      {hint ? (
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
