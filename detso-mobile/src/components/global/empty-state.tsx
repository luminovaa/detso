import React from "react";
import { View, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./text";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface EmptyStateProps extends ViewProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export function EmptyState({
  icon = "document-text-outline",
  title,
  description,
  actionLabel,
  onAction,
  isLoading = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View 
      className={cn("flex-1 items-center justify-center py-12 px-8", className)} 
      {...props}
    >
      {/* Icon Container */}
      <View className="w-24 h-24 bg-muted/50 rounded-full items-center justify-center mb-6 border border-border/50">
        <View className="w-16 h-16 bg-muted rounded-full items-center justify-center">
          <Ionicons name={icon} size={40} color="hsl(var(--muted-foreground))" />
        </View>
      </View>

      {/* Text Content */}
      <Text weight="bold" className="text-xl text-foreground text-center mb-2">
        {title}
      </Text>
      
      {description && (
        <Text className="text-muted-foreground text-center mb-8 leading-5">
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          isLoading={isLoading}
          variant="outline"
          className="min-w-[160px]"
          size="md"
        />
      )}
    </View>
  );
}
