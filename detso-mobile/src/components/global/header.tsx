// src/components/global/header.tsx
import React from "react";
import { View, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";

interface HeaderProps {
  /** Judul halaman */
  title: string;
  /** Tampilkan tombol kembali di sebelah kiri? (Default: false) */
  showBackButton?: boolean;
  /** Tampilkan avatar profile di kiri? (Default: true untuk dashboard) */
  showAvatar?: boolean;
  /** Tampilkan notification icon di kanan? (Default: true untuk dashboard) */
  showNotification?: boolean;
  /** Komponen bebas yang ingin ditaruh di pojok kanan (Ikon, Tombol, dll) */
  rightNode?: React.ReactNode;
  /** Override fungsi tombol back jika tidak ingin pakai router.back() bawaan */
  onBackPress?: () => void;
  /** Source URL avatar — dikirim dari luar, bukan dari store */
  avatarSrc?: string | null;
  /** Nama fallback untuk inisial avatar jika gambar tidak tersedia */
  avatarAlt?: string;
  /** Override aksi saat avatar ditekan */
  onAvatarPress?: () => void;
}

export function Header({ 
  title, 
  showBackButton = false, 
  showAvatar = false,
  showNotification = false,
  rightNode,
  onBackPress,
  avatarSrc,
  avatarAlt,
  onAvatarPress,
}: HeaderProps) {
  
    const handleBack = () => {
      if (onBackPress) {
        onBackPress();
      } else if (router.canGoBack()) {
        router.back();
      }
    };

    const handleAvatarPress = () => {
      if (onAvatarPress) {
        onAvatarPress();
      } else {
        router.push("/settings/edit-profile");
      }
    };

    const handleNotificationPress = () => {
      // TODO: Navigate to notification screen
      console.log("Notification pressed");
    };

    // Tinggi status bar tanpa perlu hook navigation
    const statusBarHeight = Platform.OS === "android" 
      ? (StatusBar.currentHeight || 24) 
      : 44;

      return (
      <View 
        className="bg-primary pb-12 px-4"
        style={{ 
          paddingTop: statusBarHeight + 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
      <View className="flex-row items-center justify-between">
        {/* KIRI: Avatar atau Back Button */}
        <View className="flex-row items-center">
          {showAvatar ? (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleAvatarPress}
              className="mr-3"
            >
              <Avatar
                src={avatarSrc}
                alt={avatarAlt}
                size="xl"
                className="border-2 border-white/30"
              />
            </TouchableOpacity>
          ) : showBackButton ? (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleBack} 
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
          ) : null}
          
          <Text 
            weight="bold" 
            className="text-2xl text-white" 
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* KANAN: Notification atau Custom Node */}
        <View className="flex-row items-center gap-2">
          {showNotification && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleNotificationPress}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={22} color="white" />
              {/* Badge untuk unread notification */}
              <View className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </TouchableOpacity>
          )}
          
          {rightNode && (
            <View className="justify-center items-end">
              {rightNode}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}