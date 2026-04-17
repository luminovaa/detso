import React, { useState, useEffect } from "react";
import { View, Image, ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { Text } from "./text";

// --- VARIANT UKURAN ---
const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  "2xl": "h-24 w-24", // Cocok untuk halaman Edit Profile
};

const avatarTextSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
  "2xl": "text-2xl",
};

export type AvatarSize = keyof typeof avatarSizes;

// ==========================================
// 1. KOMPONEN AVATAR SINGLE
// ==========================================
export interface AvatarProps extends ViewProps {
  src?: string | null;
  alt?: string; // Nama untuk dijadikan inisial jika gambar gagal
  size?: AvatarSize;
}

// Fungsi pintar untuk mengambil inisial nama
const getInitials = (name?: string) => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export function Avatar({
  src,
  alt,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  
  // Reset state error saat sumber gambar (src) berubah
  // Sangat penting agar preview update setelah ganti foto kalau sebelumnya error
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <View
      className={cn(
        "relative items-center justify-center overflow-hidden rounded-full bg-muted",
        avatarSizes[size],
        className,
      )}
      {...props}
    >
      {/* Jika ada src gambar dan tidak error, tampilkan gambarnya */}
      {src && !imageFailed ? (
        <Image
          source={{ uri: src }}
          className="h-full w-full"
          resizeMode="cover"
          onError={() => setImageFailed(true)} // Jika link mati, otomatis fallback ke inisial
        />
      ) : (
        /* Fallback Inisial Nama */
        <Text
          weight="semibold"
          className={cn("text-muted-foreground", avatarTextSizes[size])}
        >
          {getInitials(alt)}
        </Text>
      )}
    </View>
  );
}

// ==========================================
// 2. KOMPONEN AVATAR GROUP
// ==========================================
export interface AvatarGroupProps extends ViewProps {
  users: { src?: string | null; alt?: string }[];
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({
  users,
  max = 3,
  size = "md",
  className,
  ...props
}: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const extraUsers = users.length - max;

  // Jarak overlapping (negatif margin) tergantung ukurannya
  const overlapClasses = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
    xl: "-ml-5",
    "2xl": "-ml-6",
  };

  return (
    <View className={cn("flex-row items-center", className)} {...props}>
      {visibleUsers.map((user, index) => (
        <View
          key={index}
          className={cn(
            "rounded-full border-2 border-background", // Border setebal 2px mengikuti warna background aplikasi
            index > 0 && overlapClasses[size], // Beri margin negatif mulai dari avatar kedua
          )}
        >
          <Avatar src={user.src} alt={user.alt} size={size} />
        </View>
      ))}

      {/* Jika ada sisa user, tampilkan angka sisanya (Contoh: +2) */}
      {extraUsers > 0 && (
        <View
          className={cn(
            "items-center justify-center rounded-full border-2 border-background bg-muted",
            avatarSizes[size],
            overlapClasses[size], // Margin negatif juga untuk sisanya
          )}
        >
          <Text
            weight="semibold"
            className={cn("text-muted-foreground", avatarTextSizes[size])}
          >
            +{extraUsers}
          </Text>
        </View>
      )}
    </View>
  );
}
