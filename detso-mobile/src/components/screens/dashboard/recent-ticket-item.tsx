// src/components/screens/dashboard/recent-ticket-item.tsx
import React, { useCallback, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { RecentTicket } from "@/src/features/dashboard/types";
import { formatRelativeTime } from "@/src/lib/format-date";
import { TICKET_PRIORITY_COLORS } from "@/src/lib/ticket-constants";
import { useLanguageStore, useT } from "@/src/features/i18n/store";

import { COLORS } from '@/src/lib/colors';
interface RecentTicketItemProps {
  item: RecentTicket;
}

const statusVariants = {
  OPEN: "default" as const,
  IN_PROGRESS: "default" as const,
  RESOLVED: "success" as const,
  CLOSED: "outline" as const,
};

export const RecentTicketItem = React.memo(function RecentTicketItem({ item }: RecentTicketItemProps) {
  const locale = useLanguageStore((s) => s.locale);
  const { t } = useT();
  const timeAgo = formatRelativeTime(item.created_at, locale);

  const statusLabels: Record<string, string> = useMemo(() => ({
    OPEN: t("ticket.status.OPEN"),
    IN_PROGRESS: t("ticket.status.IN_PROGRESS"),
    RESOLVED: t("ticket.status.RESOLVED"),
    CLOSED: t("ticket.status.CLOSED"),
  }), [t]);

  const priorityLabels: Record<string, string> = useMemo(() => ({
    LOW: t("ticket.priority.LOW"),
    MEDIUM: t("ticket.priority.MEDIUM"),
    HIGH: t("ticket.priority.HIGH"),
    URGENT: t("ticket.priority.URGENT"),
  }), [t]);

  const handlePress = useCallback(() => {
    router.push(`/ticket/${item.id}/detail` as any);
  }, [item.id]);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text weight="semibold" className="text-base text-foreground" numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Badge variant={statusVariants[item.status]}>
              {statusLabels[item.status] || item.status}
            </Badge>
          </View>

          <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>
            {item.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="person-outline" size={14} color={COLORS.neutral.gray[500]} />
              <Text className="text-xs text-muted-foreground ml-1" numberOfLines={1}>
                {item.customer.name}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons 
                name="flag" 
                size={12} 
                color={TICKET_PRIORITY_COLORS[item.priority] || COLORS.neutral.gray[500]} 
              />
              <Text className="text-xs text-muted-foreground ml-1">
                {priorityLabels[item.priority] || item.priority}
              </Text>
            </View>

            <View className="flex-row items-center ml-3">
              <Ionicons name="time-outline" size={12} color={COLORS.neutral.gray[500]} />
              <Text className="text-xs text-muted-foreground ml-1">
                {timeAgo}
              </Text>
            </View>
          </View>

          {item.technician && (
            <View className="flex-row items-center mt-2 pt-2 border-t border-border">
              <Ionicons name="construct-outline" size={14} color={COLORS.brand.primary} />
              <Text className="text-xs text-primary ml-1">
                {item.technician.profile?.full_name || item.technician.username}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
});
