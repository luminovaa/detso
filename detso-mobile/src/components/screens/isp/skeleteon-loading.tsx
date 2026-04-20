import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function ISPSkeletonLoading() {
    return (
 <View className="px-4 pt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="mb-4 p-4 border-border/40">
          <View className="flex-row items-center">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <View className="flex-1 ml-4 gap-y-2">
              <View className="flex-row justify-between items-center">
                <Skeleton className="w-1/2 h-5 rounded-md" />
                <Skeleton className="w-16 h-4 rounded-full" />
              </View>
              <Skeleton className="w-3/4 h-3 rounded-md" />
              <View className="flex-row gap-x-4 mt-1">
                <Skeleton className="w-20 h-4 rounded-md" />
                <Skeleton className="w-20 h-4 rounded-md" />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
    );
}