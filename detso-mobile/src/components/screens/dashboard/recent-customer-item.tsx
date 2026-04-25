// src/components/screens/dashboard/recent-customer-item.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";
import { RecentCustomer } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useLanguageStore } from "@/src/features/i18n/store";

interface RecentCustomerItemProps {
  item: RecentCustomer;
}

export function RecentCustomerItem({ item }: RecentCustomerItemProps) {
  const locale = useLanguageStore((s) => s.locale);
  const timeAgo = formatRelativeTime(item.created_at, locale);

  const handlePress = () => {
    // TODO: Navigate to customer detail
    console.log("Navigate to customer:", item.id);
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row items-center">
            <Avatar
              src={null}
              alt={item.name}
              size="lg"
              className="mr-3 bg-primary/5 border border-primary/10"
            />

            <View className="flex-1">
              <Text weight="semibold" className="text-base text-foreground mb-1" numberOfLines={1}>
                {item.name}
              </Text>

              {item.phone && (
                <View className="flex-row items-center mb-1">
                  <Ionicons name="call-outline" size={12} color="hsl(var(--muted-foreground))" />
                  <Text className="text-xs text-muted-foreground ml-1">
                    {item.phone}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center">
                <Ionicons name="wifi-outline" size={12} color="hsl(var(--primary))" />
                <Text className="text-xs text-primary ml-1">
                  {item._count.service} Layanan
                </Text>
                <Text className="text-xs text-muted-foreground mx-1">•</Text>
                <Ionicons name="time-outline" size={12} color="hsl(var(--muted-foreground))" />
                <Text className="text-xs text-muted-foreground ml-1">
                  {timeAgo}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="hsl(var(--muted-foreground))"
            />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}
