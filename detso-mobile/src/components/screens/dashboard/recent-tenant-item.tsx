import React from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Avatar } from "@/src/components/global/avatar";
import { RecentTenant } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useT, useLanguageStore } from "@/src/features/i18n/store";

export interface RecentTenantItemProps {
  item: RecentTenant;
  isLast?: boolean;
}

export function RecentTenantItem({ item, isLast }: RecentTenantItemProps) {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);

  const timeAgo = formatRelativeTime(item.created_at, locale);

  const handlePress = () => {
    router.push(`/isp/${item.id}/detail`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${
        isLast ? "" : "border-b border-border/60"
      }`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Avatar
          src={item.logo || undefined}
          alt={item.name}
          size="md"
          className="mr-3 bg-primary/10 border border-primary/20"
        />
        <View className="flex-1">
          <Text weight="semibold" className="text-sm font-sf-semibold text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {item._count.customers} {t("isp.customers")} · {item._count.users} {t("common.user")} · {timeAgo}
          </Text>
        </View>
      </View>
      <Badge colorVariant={item.is_active ? "success" : "neutral"}>
        {item.is_active ? t("isp.active") : t("isp.inactive")}
      </Badge>
    </Pressable>
  );
}
