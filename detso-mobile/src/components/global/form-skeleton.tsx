// src/components/global/form-skeleton.tsx
import React from "react";
import { View } from "react-native";
import { Skeleton } from "./skeleton";

interface FormSkeletonProps {
  /** Jumlah field input yang akan ditampilkan */
  fieldCount?: number;
  /** Tampilkan avatar picker skeleton? */
  showAvatar?: boolean;
  /** Tampilkan map picker skeleton? */
  showMap?: boolean;
}

export function FormSkeleton({ 
  fieldCount = 5, 
  showAvatar = false,
  showMap = false 
}: FormSkeletonProps) {
  return (
    <View className="flex-1 pt-4">
      {/* Avatar Section */}
      {showAvatar && (
        <View className="items-center mb-6">
          <Skeleton className="w-24 h-24 rounded-full mb-3" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </View>
      )}

      {/* Form Fields */}
      {Array.from({ length: fieldCount }).map((_, i) => (
        <View key={i} className="mb-4">
          {/* Label */}
          <Skeleton className="h-4 w-24 rounded-lg mb-2" />
          {/* Input Field */}
          <Skeleton className="h-12 rounded-xl" />
        </View>
      ))}

      {/* Map Picker Section */}
      {showMap && (
        <View className="mb-4">
          <Skeleton className="h-4 w-32 rounded-lg mb-2" />
          <Skeleton className="h-48 rounded-xl" />
        </View>
      )}

      {/* Submit Button */}
      <View className="mt-6">
        <Skeleton className="h-12 rounded-xl" />
      </View>
    </View>
  );
}
