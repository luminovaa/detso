import React, { useState } from "react";
import { View, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { cn } from "../../lib/utils";
import { Text } from "./text";

export interface TabsProps {
  /** Daftar opsi tab (Contoh: ["Semua", "Pending", "Selesai"]) */
  options: string[];
  /** Opsi yang sedang aktif/terpilih */
  selectedValue: string;
  /** Fungsi yang dipanggil saat tab di-klik */
  onValueChange: (value: string) => void;
  className?: string;
}

// Konstanta padding untuk hitung-hitungan animasi (p-1 di Tailwind = 4px)
const PADDING = 4;

export function Tabs({
  options,
  selectedValue,
  onValueChange,
  className,
}: TabsProps) {
  // State untuk menyimpan lebar dinamis dari kontainer
  const [containerWidth, setContainerWidth] = useState(0);

  // Cari index tab yang sedang aktif
  const activeIndex = Math.max(options.indexOf(selectedValue), 0);

  // Hitung lebar area yang tersedia dan lebar per-masing-masing tab
  const availableWidth = containerWidth - PADDING * 2;
  const tabWidth = containerWidth > 0 ? availableWidth / options.length : 0;

  // Animasi Reanimated untuk menggeser kapsul (pill) background
  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [
      {
        translateX: withSpring(activeIndex * tabWidth, {
          mass: 1,
          damping: 20, // Mengurangi pantulan berlebih
          stiffness: 250, // Kecepatan luncuran
        }),
      },
    ],
  }));

  return (
    <View
      className={cn("flex-row bg-muted rounded-xl relative", className)}
      // Padding harus di-set via style agar sama persis dengan konstanta PADDING
      style={{ padding: PADDING }}
      // Ambil lebar kontainer saat komponen di-render
      onLayout={(e: LayoutChangeEvent) =>
        setContainerWidth(e.nativeEvent.layout.width)
      }
    >
      {/* 1. Kapsul Indikator (Background Putih/Card yang meluncur) */}
      {containerWidth > 0 && (
        <Animated.View
          className="absolute bg-background rounded-lg shadow-sm border border-border/50"
          style={[
            indicatorStyle,
            { top: PADDING, bottom: PADDING, left: PADDING },
          ]}
        />
      )}

      {/* 2. Tombol-Tombol Teks */}
      {options.map((option) => {
        const isActive = selectedValue === option;

        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.7}
            onPress={() => onValueChange(option)}
            className="flex-1 items-center justify-center py-2 z-10"
          >
            <Text
              weight={isActive ? "bold" : "medium"}
              className={cn(
                "text-sm transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
