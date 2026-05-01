import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function TeamSkeletonLoading() {
  return (
    <View className="pt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-3 overflow-hidden border-border/40">
          <View className="flex-row items-center p-4">
            {/* Avatar - match TeamItem Avatar size="lg" with border */}
            <View className="relative">
              <Skeleton className="w-12 h-12 rounded-full" />
              {/* Border effect */}
              <View className="absolute inset-0 rounded-full border-2 border-transparent" />
            </View>
            
            <View className="flex-1 ml-3">
              {/* Name */}
              <Skeleton className="h-4 w-40 rounded-lg mb-1" />
              
              {/* Email */}
              <Skeleton className="h-3 w-48 rounded-lg mt-0.5" />
              
              {/* Role Badge */}
              <View className="flex-row mt-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}
