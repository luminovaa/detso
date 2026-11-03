import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/src/components/global/text";

export interface GroupedSectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function GroupedSection({
  title,
  actionLabel,
  onAction,
  children,
  className,
}: GroupedSectionProps) {
  return (
    <View className={className ?? "mb-6"}>
      <View className="flex-row items-center justify-between mb-2.5">
        <Text weight="bold" className="text-lg text-foreground">
          {title}
        </Text>
        {actionLabel ? (
          <Pressable
            onPress={onAction}
            className="min-h-11 px-2 items-center justify-center"
          >
            <Text weight="semibold" className="text-sm text-primary">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="bg-card border border-border rounded-2xl overflow-hidden">
        {children}
      </View>
    </View>
  );
}
