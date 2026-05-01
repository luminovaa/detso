import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function TicketSkeletonLoading() {
  return (
    <View className="pt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-3 overflow-hidden border-border/40">
          <View className="p-4">
            {/* Priority + Status badges */}
            <View className="flex-row gap-x-2 mb-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </View>

            {/* Title */}
            <Skeleton className="h-4 w-56 rounded-lg mb-2" />

            {/* Customer + Service */}
            <Skeleton className="h-3 w-48 rounded-lg mb-1" />

            {/* Technician */}
            <Skeleton className="h-3 w-36 rounded-lg mb-2" />

            {/* Time */}
            <Skeleton className="h-3 w-24 rounded-lg" />
          </View>
        </Card>
      ))}
    </View>
  );
}
