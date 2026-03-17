import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { Text } from "./text"; // Gunakan Text custom kita agar font-nya SF Pro!

export interface BadgeProps extends ViewProps {
  children?: React.ReactNode;
  label?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "accent";
}

function Badge({
  children,
  label,
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  // 1. Styling untuk Container (Background & Border)
  const containerVariants = {
    default: "bg-primary border-transparent",
    secondary: "bg-secondary border-transparent",
    destructive: "bg-destructive border-transparent",
    accent: "bg-accent border-transparent",
    outline: "bg-transparent border-border", // Outline pakai border dari tema
  };

  // 2. Styling untuk Text (Warna Teks)
  const textVariants = {
    default: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive-foreground",
    accent: "text-accent-foreground",
    outline: "text-foreground",
  };

  return (
    <View
      className={cn(
        "flex-row items-center justify-center rounded-full border px-2.5 py-0.5 self-start",
        containerVariants[variant],
        className,
      )}
      {...props}
    >
      {/* Jika pakai children (bisa disisipi icon kecil) */}
      {children ? (
        children
      ) : (
        /* Jika pakai label biasa */
        <Text
          weight="semibold"
          className={cn("text-xs", textVariants[variant])}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export { Badge };
