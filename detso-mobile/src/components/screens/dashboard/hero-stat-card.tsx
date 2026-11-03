import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/global/text";

export interface HeroStatCardProps {
  label: string;
  value: number;
  total: number;
  onlineLabel?: string;
}

export function HeroStatCard({ label, value, total, onlineLabel }: HeroStatCardProps) {
  return (
    <View className="bg-primary rounded-2xl p-5 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text weight="bold" className="text-primary-foreground/80 text-xs uppercase tracking-wider">
          {label}
        </Text>
        {onlineLabel ? (
          <View className="bg-primary-foreground/15 rounded-full px-2.5 py-0.5">
            <Text weight="semibold" className="text-primary-foreground text-xs">
              {onlineLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-baseline gap-1.5">
        <Text weight="bold" className="text-primary-foreground text-4xl font-sf-bold">
          {value.toLocaleString()}
        </Text>
        <Text weight="medium" className="text-primary-foreground/70 text-lg">
          / {total.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
