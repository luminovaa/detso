import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function PackageSkeletonLoading() {
  return (
    <View className="pt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-4 overflow-hidden border-border/40">
          <View className="flex-row items-center p-4">
            {/* Icon Package */}
            <Skeleton className="w-14 h-14 rounded-xl" />
            
            <View className="flex-1 ml-4">
              {/* Name */}
              <Skeleton className="h-4 w-40 rounded-lg mb-2" />
              
              {/* Speed */}
              <Skeleton className="h-3 w-32 rounded-lg mb-2" />
              
              {/* Price Badge */}
              <Skeleton className="h-6 w-28 rounded-full" />
            </View>
            
            {/* Chevron */}
            <Skeleton className="w-5 h-5 rounded-full ml-2" />
          </View>
        </Card>
      ))}
    </View>
  );
}
