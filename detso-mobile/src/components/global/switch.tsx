import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { cn } from "../../lib/utils";
import { Text } from "./text";
import { Label } from "./label";

// ==========================================
// 1. KOMPONEN SWITCH DASAR
// ==========================================
export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  // Animasi geser untuk lingkaran putih (Thumb)
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    // Lebar track = 44px (w-11), Lebar thumb = 20px (w-5)
    // Posisi Off = geser 2px dari kiri
    // Posisi On = geser 22px dari kiri (44 - 20 - 2)
    return {
      transform: [
        {
          translateX: withSpring(checked ? 18 : 2, {
            mass: 1,
            damping: 15, // Meredam pantulan agar tidak berlebihan
            stiffness: 250, // Kecepatan luncuran
          }),
        },
      ],
    };
  });

  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "h-6 w-11 rounded-full justify-center transition-colors duration-200 border border-transparent",
        checked ? "bg-primary" : "bg-input", // Ganti warna background
        disabled && "opacity-50",
        className,
      )}
    >
      <Animated.View
        className="h-5 w-5 rounded-full bg-white shadow-sm shadow-black/30"
        style={thumbAnimatedStyle}
      />
    </Pressable>
  );
}

// ==========================================
// 2. PEMBUNGKUS UNTUK REACT-HOOK-FORM
// ==========================================
interface FormSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: FormSwitchProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View className="flex-row items-center justify-between py-3 border-b border-border/50">
          {/* Teks Sebelah Kiri */}
          <View className="flex-1 pr-4">
            <Label className="mb-1">{label}</Label>
            {description && (
              <Text className="text-sm text-muted-foreground leading-snug">
                {description}
              </Text>
            )}
          </View>

          {/* Switch Sebelah Kanan */}
          <Switch
            checked={!!value}
            onCheckedChange={onChange}
            disabled={disabled}
          />
        </View>
      )}
    />
  );
}
