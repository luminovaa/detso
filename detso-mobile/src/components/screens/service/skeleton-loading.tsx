import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function ServiceSkeletonLoading() {
  return (
    <View className="pt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-3 overflow-hidden border-border/40">
          <View className="flex-row items-center p-4">
            {/* Icon - match ServiceItem icon size */}
            <Skeleton className="w-12 h-12 rounded-xl" />
            
            <View className="flex-1 ml-3">
              {/* Customer Name */}
              <Skeleton className="h-4 w-40 rounded-lg mb-1" />
              
              {/* Package Name */}
              <View className="flex-row items-center mt-0.5">
                <Skeleton className="h-3 w-36 rounded-lg" />
              </View>
              
              {/* IP Address */}
              <Skeleton className="h-3 w-32 rounded-lg mt-0.5" />
              
              {/* Status Badge */}
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
