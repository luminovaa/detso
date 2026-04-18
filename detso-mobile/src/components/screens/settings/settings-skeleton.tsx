import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/src/components/global/skeleton";
import { Card, CardContent } from "@/src/components/global/card";

export function SettingsSkeleton() {
  return (
    <View className="flex-1 pt-4 pb-24">
      {/* --- 1. PROFILE SECTION SKELETON --- */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="flex-row items-center p-5">
          {/* Avatar Circle */}
          <Skeleton className="w-16 h-16 rounded-full" />
          
          <View className="flex-1 ml-4 justify-center">
            {/* Name Line */}
            <Skeleton className="h-5 w-32 mb-2" />
            {/* Role Badge */}
            <Skeleton className="h-4 w-20 rounded-full" />
            {/* Email Line */}
            <Skeleton className="h-3 w-40 mt-2" />
          </View>

          {/* Edit Icon Circle */}
          <Skeleton className="w-10 h-10 rounded-full" />
        </CardContent>
      </Card>

      {/* --- 2. PREFERENCES SECTION SKELETON --- */}
      {/* Section Title */}
      <View className="mb-3 ml-2">
        <Skeleton className="h-4 w-24" />
      </View>
      
      <Card className="mb-8">
        <CardContent className="p-0">
          {[1, 2, 3].map((i) => (
            <View 
              key={i} 
              className={`flex-row items-center justify-between p-4 ${i < 3 ? "border-b border-border/50" : ""}`}
            >
              <View className="flex-row items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4" />
                <Skeleton className="h-5 w-32" />
              </View>
              {/* Right side placeholder (Arrow or Switch) */}
              <Skeleton className="h-6 w-12 rounded-full" />
            </View>
          ))}
        </CardContent>
      </Card>

      {/* --- 3. SUPPORT SECTION SKELETON --- */}
      <View className="mb-3 ml-2">
        <Skeleton className="h-4 w-32" />
      </View>

      <Card className="mb-10">
        <CardContent className="p-0">
          {[1, 2].map((i) => (
            <View 
              key={i} 
              className={`flex-row items-center justify-between p-4 ${i < 2 ? "border-b border-border/50" : ""}`}
            >
              <View className="flex-row items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4" />
                <Skeleton className="h-5 w-36" />
              </View>
              <Skeleton className="h-5 w-8" />
            </View>
          ))}
        </CardContent>
      </Card>

      {/* --- 4. SECURITY SECTION SKELETON --- */}
      <View className="mb-3 ml-2">
        <Skeleton className="h-4 w-28" />
      </View>

      <Card className="mb-10">
        <CardContent className="p-0">
          {[1, 2, 3].map((i) => (
            <View 
              key={i} 
              className={`flex-row items-center justify-between p-4 ${i < 3 ? "border-b border-border/50" : ""}`}
            >
              <View className="flex-row items-center">
                <Skeleton className="w-10 h-10 rounded-xl mr-4" />
                <Skeleton className="h-5 w-40" />
              </View>
              <Skeleton className="h-5 w-5" />
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  );
}
