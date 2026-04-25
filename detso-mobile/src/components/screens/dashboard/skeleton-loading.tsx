import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/src/components/global/skeleton";
import { Card, CardContent } from "@/src/components/global/card";

export function DashboardSkeletonLoading() {
  return (
    <View className="flex-1 pt-4">
      {/* Metrics Grid - Row 1 */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Card>
            <CardContent className="p-4">
              {/* Icon Circle */}
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              {/* Value */}
              <Skeleton className="h-9 w-16 rounded-lg mb-1" />
              {/* Label */}
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardContent>
          </Card>
        </View>
        <View className="flex-1">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              <Skeleton className="h-9 w-16 rounded-lg mb-1" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Metrics Grid - Row 2 */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              <Skeleton className="h-9 w-16 rounded-lg mb-1" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardContent>
          </Card>
        </View>
        <View className="flex-1">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              <Skeleton className="h-9 w-16 rounded-lg mb-1" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Section Title */}
      <Skeleton className="h-6 w-48 rounded-lg mb-3" />

      {/* Recent Activities - Match RecentTenantItem structure */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <View className="flex-row items-center">
              {/* Avatar */}
              <Skeleton className="w-12 h-12 rounded-full mr-3" />
              
              {/* Content */}
              <View className="flex-1">
                {/* Name + Badge */}
                <View className="flex-row items-center mb-1">
                  <Skeleton className="h-4 w-32 rounded-lg flex-1 mr-2" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </View>
                
                {/* Stats Row */}
                <Skeleton className="h-3 w-40 rounded-lg mb-1" />
                
                {/* Time */}
                <Skeleton className="h-3 w-24 rounded-lg" />
              </View>
            </View>
          </CardContent>
        </Card>
      ))}

      {/* Map Skeleton */}
      <Card className="mt-3">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 rounded-lg mb-3" />
          <Skeleton className="h-64 rounded-2xl" />
        </CardContent>
      </Card>
    </View>
  );
}
