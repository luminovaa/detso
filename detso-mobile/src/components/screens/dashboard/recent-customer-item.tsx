import React, { useCallback } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Avatar } from "@/src/components/global/avatar";
import { RecentCustomer } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useLanguageStore, useT } from "@/src/features/i18n/store";

export interface RecentCustomerItemProps {
  item: RecentCustomer;
  isLast?: boolean;
}

export const RecentCustomerItem = React.memo(function RecentCustomerItem({
  item,
  isLast,
}: RecentCustomerItemProps) {
  const locale = useLanguageStore((s) => s.locale);
  const { t } = useT();
  const timeAgo = formatRelativeTime(item.created_at, locale);

  const handlePress = useCallback(() => {
    router.push(`/customer/${item.id}/detail`);
  }, [item.id]);

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${
        isLast ? "" : "border-b border-border/60"
      }`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Avatar
          src={null}
          alt={item.name}
          size="md"
          className="mr-3 bg-primary/10 border border-primary/20"
        />
        <View className="flex-1">
          <Text weight="semibold" className="text-sm font-sf-semibold text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {item._count.service} {t("tenantDashboard.services")} · {timeAgo}
          </Text>
        </View>
      </View>
      <Badge colorVariant="success">
        {t("service.statusActive")}
      </Badge>
    </Pressable>
  );
});
