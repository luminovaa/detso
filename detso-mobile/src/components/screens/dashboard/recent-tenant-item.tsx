// src/components/screens/dashboard/recent-tenant-item.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Avatar } from "@/src/components/global/avatar";
import { RecentTenant } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useT, useLanguageStore } from "@/src/features/i18n/store";

interface RecentTenantItemProps {
  item: RecentTenant;
}

export function RecentTenantItem({ item }: RecentTenantItemProps) {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);

  const timeAgo = formatRelativeTime(item.created_at, locale);

  const handlePress = () => {
    router.push(`/isp/${item.id}/detail`);
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row items-center">
            {/* Logo */}
            <Avatar
              src={item.logo || undefined}
              alt={item.name}
              size="lg"
              className="mr-3 bg-primary/5 border border-primary/10"
            />

            {/* Info */}
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text weight="semibold" className="text-base text-foreground flex-1" numberOfLines={1}>
                  {item.name}
                </Text>
                <Badge variant={item.is_active ? "success" : "outline"}>
                  {item.is_active ? t("isp.active") : t("isp.inactive")}
                </Badge>
              </View>

              <View className="flex-row items-center mb-1">
                <Ionicons name="people-outline" size={14} color="hsl(var(--muted-foreground))" />
                <Text className="text-sm text-muted-foreground ml-1">
                  {item._count.customers} {t("isp.customers")}
                </Text>
                <Text className="text-sm text-muted-foreground mx-1">•</Text>
                <Ionicons name="person-outline" size={14} color="hsl(var(--muted-foreground))" />
                <Text className="text-sm text-muted-foreground ml-1">
                  {item._count.users} {t("common.user")}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="hsl(var(--muted-foreground))" />
                <Text className="text-xs text-muted-foreground ml-1">
                  {timeAgo}
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}
