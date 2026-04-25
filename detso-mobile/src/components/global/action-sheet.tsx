import React, { forwardRef } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "./bottom-sheet";
import { Text } from "./text";
import { cn } from "@/src/lib/utils";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

export interface ActionSheetItem {
  key: string;
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  isLoading?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  title: string;
  description?: string;
  actions: ActionSheetItem[];
  snapPoints?: string[];
  cancelLabel?: string;
  onCancel?: () => void;
}

export const ActionSheet = forwardRef<BottomSheetModal, ActionSheetProps>(
  ({ title, description, actions, snapPoints = ["45%"], cancelLabel = "Batal", onCancel }, ref) => {
    const { insets } = useTabBarHeight();

    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      } else {
        // @ts-ignore
        ref?.current?.close();
      }
    };

    return (
      <BottomSheet ref={ref} snapPoints={snapPoints} enableDrag={false}>
        <BottomSheetHeader>
          <BottomSheetTitle>{title}</BottomSheetTitle>
          {!!description && (
            <BottomSheetDescription>{description}</BottomSheetDescription>
          )}
        </BottomSheetHeader>

        <View style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}>
          {/* Actions Group */}
          <View className="bg-card border border-border rounded-2xl overflow-hidden mb-3">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.key}
                onPress={action.onPress}
                disabled={action.disabled || action.isLoading}
                activeOpacity={0.7}
                className={cn(
                  "flex-row items-center px-5 py-4 active:bg-muted/50",
                  action.variant === "destructive" && "bg-destructive/5",
                  action.disabled && "opacity-50",
                  index !== actions.length - 1 && "border-b border-border/50"
                )}
              >
                {action.icon && !action.isLoading && (
                  <View className="mr-3">{action.icon}</View>
                )}
                {action.isLoading && (
                  <ActivityIndicator 
                    size="small" 
                    color={action.variant === "destructive" ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
                    className="mr-3"
                  />
                )}
                <Text
                  weight="semibold"
                  className={cn(
                    "flex-1 text-base",
                    action.variant === "destructive"
                      ? "text-destructive"
                      : "text-foreground"
                  )}
                >
                  {action.label}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color={action.variant === "destructive" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            className="flex-row items-center justify-center px-6 py-4 rounded-2xl bg-card border border-border"
          >
            <Text weight="semibold" className="text-base text-muted-foreground">
              {cancelLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

ActionSheet.displayName = "ActionSheet";
