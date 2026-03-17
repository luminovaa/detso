import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: ViewProps) {
  return (
    <View
      // bg-muted memberi warna abu-abu samar sesuai tema
      // animate-pulse memberikan efek animasi memudar (opacity) berulang
      // rounded-xl agar sudutnya membulat konsisten dengan desain kita
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
