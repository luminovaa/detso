import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

import { cn } from "../../lib/utils";
import { Text } from "./text";
import { Label } from "./label";

// ==========================================
// 1. KOMPONEN CHECKBOX DASAR
// ==========================================
export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: CheckboxProps) {
  // Animasi untuk memunculkan ikon centang (Membesar & Fade In)
  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(checked ? 1 : 0, {
            mass: 0.5,
            damping: 12,
            stiffness: 250,
          }),
        },
      ],
      opacity: withTiming(checked ? 1 : 0, { duration: 150 }),
    };
  });

  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "h-6 w-6 items-center justify-center rounded-md border-2 transition-colors",
        checked
          ? "border-primary bg-primary"
          : "border-primary/50 bg-background",
        disabled && "opacity-50",
        className,
      )}
    >
      <Animated.View style={checkmarkStyle}>
        <Ionicons name="checkmark-sharp" size={16} color="white" />
      </Animated.View>
    </Pressable>
  );
}

// ==========================================
// 2. PEMBUNGKUS UNTUK REACT-HOOK-FORM
// ==========================================
interface FormCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormCheckboxProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        // Gunakan Pressable di container utama agar user bisa klik teksnya juga, bukan cuma kotaknya
        <Pressable
          onPress={() => !disabled && onChange(!value)}
          className={cn("flex-row items-start gap-3 py-3", className)}
        >
          {/* Kotak Checkbox (Margin atas kecil agar sejajar dengan baris pertama teks) */}
          <View className="mt-0.5">
            <Checkbox
              checked={!!value}
              onCheckedChange={onChange} // Fungsi onChange ganda untuk jaga-jaga
              disabled={disabled}
            />
          </View>

          {/* Teks Label & Deskripsi */}
          <View className="flex-1">
            <Label className="mb-0.5">{label}</Label>
            {description && (
              <Text className="text-sm text-muted-foreground leading-snug">
                {description}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
