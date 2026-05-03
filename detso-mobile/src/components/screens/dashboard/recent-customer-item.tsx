// src/components/screens/dashboard/recent-customer-item.tsx
import React, { useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";
import { RecentCustomer } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useLanguageStore, useT } from "@/src/features/i18n/store";

import { COLORS } from '@/src/lib/colors';
interface RecentCustomerItemProps {
  item: RecentCustomer;
}

export const RecentCustomerItem = React.memo(function RecentCustomerItem({ item }: RecentCustomerItemProps) {
  const locale = useLanguageStore((s) => s.locale);
  const { t } = useT();
  const timeAgo = formatRelativeTime(item.created_at, locale);

  const handlePress = useCallback(() => {
    router.push(`/customer/${item.id}/detail` as any);
  }, [item.id]);

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
                  <Ionicons name="call-outline" size={12} color={COLORS.neutral.gray[500]} />
                  <Text className="text-xs text-muted-foreground ml-1">
                    {item.phone}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center">
                <Ionicons name="wifi-outline" size={12} color={COLORS.brand.primary} />
                <Text className="text-xs text-primary ml-1">
                  {item._count.service} {t("tenantDashboard.services")}
                </Text>
                <Text className="text-xs text-muted-foreground mx-1">•</Text>
                <Ionicons name="time-outline" size={12} color={COLORS.neutral.gray[500]} />
                <Text className="text-xs text-muted-foreground ml-1">
                  {timeAgo}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.neutral.gray[500]}
            />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
});
