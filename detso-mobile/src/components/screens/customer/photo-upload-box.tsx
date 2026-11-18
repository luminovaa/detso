import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/src/components/global/text";
import { CustomerPhotoState } from "@/src/features/customer/form-helpers";
import { useThemeColor } from "@/src/lib/theme-colors";

interface PhotoUploadBoxProps {
  label?: string;
  hint?: string;
  emptyText: string;
  photo: CustomerPhotoState | null;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

/**
 * Reusable portrait-framed image upload slot used across Customer onboarding steps.
 */
export function PhotoUploadBox({
  label,
  hint,
  emptyText,
  photo,
  onPress,
  iconName = "camera-outline",
}: PhotoUploadBoxProps) {
  const colors = useThemeColor();

  return (
    <View className="mb-4">
      {label ? (
        <Text weight="medium" className="text-sm text-muted-foreground mb-1.5">
          {label}
        </Text>
      ) : null}
      {hint ? <Text className="text-muted-foreground text-xs mb-3">{hint}</Text> : null}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={
          photo
            ? "border-2 border-dashed border-border rounded-xl aspect-[3/4] w-48 self-center items-center justify-center overflow-hidden bg-muted/20"
            : "border-2 border-dashed border-border rounded-xl h-40 items-center justify-center overflow-hidden bg-muted/20"
        }
      >
        {photo ? (
          <Image source={{ uri: photo.uri }} className="w-full h-full" resizeMode="contain" />
        ) : (
          <View className="items-center">
            <Ionicons name={iconName} size={32} color={colors.textMuted} />
            <Text className="text-muted-foreground text-xs mt-2">{emptyText}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
