// src/components/screens/dashboard/skeleton-loading.tsx
import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/src/components/global/skeleton";

export function DashboardSkeletonLoading() {
  return (
    <View className="flex-1 pt-4">
      {/* Metrics Grid */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1">
          <Skeleton className="h-28 rounded-3xl" />
        </View>
        <View className="flex-1">
          <Skeleton className="h-28 rounded-3xl" />
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <View className="flex-1">
          <Skeleton className="h-28 rounded-3xl" />
        </View>
        <View className="flex-1">
          <Skeleton className="h-28 rounded-3xl" />
        </View>
      </View>

      {/* Section Title */}
      <Skeleton className="h-6 w-48 rounded-lg mb-4" />

      {/* Recent Activities */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="mb-3">
          <Skeleton className="h-24 rounded-3xl" />
        </View>
      ))}
    </View>
  );
}
