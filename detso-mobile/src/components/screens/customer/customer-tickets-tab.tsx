import React, { useCallback } from "react";
import { View, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { EmptyState } from "../../global/empty-state";
import { Skeleton } from "../../global/skeleton";
import { useTicketsByCustomer } from "@/src/features/ticket/hooks";

import { Ticket } from "@/src/lib/types";
import { TICKET_STATUS_VARIANTS, TICKET_PRIORITY_VARIANTS } from "@/src/lib/ticket-constants";
import { formatRelativeTime } from "@/src/lib/format-date";

interface CustomerTicketsTabProps {
  customerId: string;
}

const TicketRow = React.memo(function TicketRow({ item }: { item: Ticket }) {
  const handlePress = useCallback(() => {
    router.push(`/ticket/${item.id}/detail` as any);
  }, [item.id]);

  return (
    <Card className="mb-3 border-border/40">
      <View className="p-4" onTouchEnd={handlePress}>
        {/* Badges */}
        <View className="flex-row items-center gap-x-2 mb-2">
          <Badge colorVariant={TICKET_PRIORITY_VARIANTS[item.priority] || "neutral"}>
            {item.priority}
          </Badge>
          <Badge colorVariant={TICKET_STATUS_VARIANTS[item.status] || "neutral"}>
            {item.status}
          </Badge>
        </View>

        {/* Title */}
        <Text weight="semibold" className="text-base text-foreground mb-1" numberOfLines={2}>
          {item.title}
        </Text>

        {/* Description */}
        {item.description && (
          <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Footer */}
        <View className="flex-row items-center gap-x-3">
          {item.technician && (
            <View className="flex-row items-center">
              <Ionicons name="construct-outline" size={11} color="hsl(var(--muted-foreground))" />
              <Text className="text-[11px] text-muted-foreground ml-1">
                {item.technician.profile?.full_name || item.technician.username}
              </Text>
            </View>
          )}
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={11} color="hsl(var(--muted-foreground))" />
            <Text className="text-[11px] text-muted-foreground ml-1">
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

export function CustomerTicketsTab({ customerId }: CustomerTicketsTabProps) {
  const { data, isLoading, refetch, isRefetching } = useTicketsByCustomer(customerId);

  const tickets: Ticket[] = data?.data?.tickets || [];

  if (isLoading) {
    return (
      <View className="gap-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={tickets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TicketRow item={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="Belum ada tiket"
          description="Customer ini belum memiliki tiket support"
          actionLabel="Refresh"
          onAction={refetch}
          isLoading={isRefetching}
        />
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  );
}
