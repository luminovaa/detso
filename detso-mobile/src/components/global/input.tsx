import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { cn } from "../../lib/utils";
import { Ionicons } from "@expo/vector-icons";

export interface InputProps extends TextInputProps {
  error?: string;
  isPassword?: boolean;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, error, isPassword, secureTextEntry, ...props }, ref) => {
    // State untuk toggle mata (show/hide password)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // State focus manual untuk backup jika pseudo-class 'focus:' telat merender di beberapa device Android lama
    const [isFocused, setIsFocused] = useState(false);

    // Tentukan apakah teks disembunyikan
    const shouldHideText = isPassword ? !isPasswordVisible : secureTextEntry;

    return (
      <View className="mb-4">
        <View
          className={cn(
            "flex-row items-center h-14 w-full rounded-2xl border bg-background px-4",
            // Logic Border Color
            error
              ? "border-destructive" // Merah kalau error
              : isFocused
                ? "border-primary" // Biru (Primary) kalau sedang diketik
                : "border-input", // Abu-abu kalau normal
            // Efek transparan kalau disabled
            props.editable === false ? "opacity-50 bg-muted" : "",
            className,
          )}
        >
          <TextInput
            ref={ref}
            className="flex-1 h-full text-base text-foreground leading-tight"
            placeholderTextColor="#94a3b8" // Warna text-muted-foreground
            secureTextEntry={shouldHideText}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Tombol Show/Hide Password */}
          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="ml-2 p-1"
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#64748b"
              />
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <Text className="text-xs text-destructive mt-1 ml-1 font-medium">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = "Input";

export { Input };
