import React, { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { RecentTicket } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { TICKET_STATUS_VARIANTS } from "@/src/lib/ticket-constants";
import { useLanguageStore, useT } from "@/src/features/i18n/store";

export interface RecentTicketItemProps {
  item: RecentTicket;
  isLast?: boolean;
}

export const RecentTicketItem = React.memo(function RecentTicketItem({
  item,
  isLast,
}: RecentTicketItemProps) {
  const locale = useLanguageStore((s) => s.locale);
  const { t } = useT();
  const timeAgo = formatRelativeTime(item.created_at, locale);

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      OPEN: t("ticket.statusOpen"),
      IN_PROGRESS: t("ticket.statusInProgress"),
      RESOLVED: t("ticket.statusResolved"),
      CLOSED: t("ticket.statusClosed"),
    }),
    [t],
  );

  const handlePress = useCallback(() => {
    router.push(`/ticket/${item.id}/detail`);
  }, [item.id]);

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${
        isLast ? "" : "border-b border-border/60"
      }`}
    >
      <View className="flex-1">
        <Text weight="semibold" className="text-sm font-sf-semibold text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {item.customer.name} · {timeAgo}
        </Text>
      </View>
      <Badge colorVariant={TICKET_STATUS_VARIANTS[item.status]}>
        {statusLabels[item.status] || item.status}
      </Badge>
    </Pressable>
  );
});
