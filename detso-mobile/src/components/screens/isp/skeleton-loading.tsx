import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function ISPSkeletonLoading() {
  return (
    <View className="pt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-4 overflow-hidden border-border/40">
          <View className="flex-row items-center p-4">
            {/* Avatar - match ISPItem size="lg" (w-12 h-12) */}
            <Skeleton className="w-12 h-12 rounded-full" />
            
            <View className="flex-1 ml-4">
              {/* Name + Badge Row */}
              <View className="flex-row justify-between items-start mb-1">
                <Skeleton className="h-4 w-32 rounded-lg flex-1 mr-2" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </View>
              
              {/* Phone + Address */}
              <Skeleton className="h-3 w-48 rounded-lg mb-3" />
              
              {/* Stats Row */}
              <View className="flex-row gap-x-4">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </View>
            </View>
            
            {/* Chevron */}
            <Skeleton className="w-5 h-5 rounded-full ml-2" />
          </View>
        </Card>
      ))}
    </View>
  );
}
