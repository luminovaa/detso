// src/components/global/header.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Text } from "@/src/components/global/text";

interface HeaderProps {
  /** Judul halaman */
  title: string;
  /** Tampilkan tombol kembali di sebelah kiri? (Default: false) */
  showBackButton?: boolean;
  /** Komponen bebas yang ingin ditaruh di pojok kanan (Ikon, Tombol, dll) */
  rightNode?: React.ReactNode;
  /** Override fungsi tombol back jika tidak ingin pakai router.back() bawaan */
  onBackPress?: () => void;
}

export function Header({ 
  title, 
  showBackButton = false, 
  rightNode,
  onBackPress 
}: HeaderProps) {
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between pt-6 pb-4">
      {/* KIRI & TENGAH: Tombol Back (Jika Ada) + Judul */}
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleBack} 
            className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="hsl(var(--foreground))" />
          </TouchableOpacity>
        )}
        
        <Text 
          weight="bold" 
          // Jika ada tombol back, ukuran teks sedikit mengecil agar proporsional. 
          // Jika tidak ada, pakai ukuran Large (3xl)
          className={`${showBackButton ? 'text-2xl' : 'text-3xl'} text-foreground flex-1`} 
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* KANAN: Action Button / Komponen Bebas (Jika Ada) */}
      {rightNode && (
        <View className="ml-4 justify-center items-end">
          {rightNode}
        </View>
      )}
    </View>
  );
}