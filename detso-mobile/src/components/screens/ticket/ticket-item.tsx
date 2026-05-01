import React, { useRef } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { Ticket, TicketPriority, TicketStatus } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";
import { formatRelativeTime } from "@/src/lib/format-date";

interface TicketItemProps {
  item: Ticket;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const getStatusVariant = (status: TicketStatus): BadgeVariantKey => {
  switch (status) {
    case "OPEN":
      return "info";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
};

const getPriorityVariant = (priority: TicketPriority): BadgeVariantKey => {
  switch (priority) {
    case "LOW":
      return "neutral";
    case "MEDIUM":
      return "info";
    case "HIGH":
      return "warning";
    case "URGENT":
      return "error";
    default:
      return "neutral";
  }
};

export function TicketItem({ item, searchQuery = "", onDelete, isDeleting }: TicketItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const statusLabelMap: Record<TicketStatus, string> = {
    OPEN: t("ticket.statusOpen"),
    IN_PROGRESS: t("ticket.statusInProgress"),
    RESOLVED: t("ticket.statusResolved"),
    CLOSED: t("ticket.statusClosed"),
  };

  const priorityLabelMap: Record<TicketPriority, string> = {
    LOW: t("ticket.priorityLow"),
    MEDIUM: t("ticket.priorityMedium"),
    HIGH: t("ticket.priorityHigh"),
    URGENT: t("ticket.priorityUrgent"),
  };

  const statusLabel = statusLabelMap[item.status] || item.status;
  const priorityLabel = priorityLabelMap[item.priority] || item.priority;

  const handlePress = () => {
    router.push(`/ticket/${item.id}/detail` as any);
  };

  const handleLongPress = () => {
    bottomSheetRef.current?.present();
  };

  const handleEdit = () => {
    bottomSheetRef.current?.close();
    router.push(`/ticket/${item.id}/edit` as any);
  };

  const handleDelete = () => {
    bottomSheetRef.current?.close();
    Alert.alert(
      t("ticket.deleteConfirm"),
      t("ticket.deleteMessage"),
      [
        { text: t("ticket.cancelBtn"), style: "cancel" },
        {
          text: t("ticket.deleteBtn"),
          style: "destructive",
          onPress: () => onDelete?.(item.id),
        },
      ],
    );
  };

  return (
    <>
      <Card className="mb-3 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="p-4"
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={250}
        >
          {/* Priority + Status Badges */}
          <View className="flex-row items-center gap-x-2 mb-2">
            <Badge colorVariant={getPriorityVariant(item.priority)}>
              {priorityLabel}
            </Badge>
            <Badge colorVariant={getStatusVariant(item.status)}>
              {statusLabel}
            </Badge>
          </View>

          {/* Title */}
          <HighlightedText
            text={item.title}
            searchQuery={searchQuery}
            className="text-base text-foreground font-semibold mb-1"
            numberOfLines={2}
          />

          {/* Customer + Service */}
          <View className="flex-row items-center mb-0.5">
            <Ionicons name="person-outline" size={12} color="hsl(var(--muted-foreground))" />
            <HighlightedText
              text={`${item.customer.name}${item.service ? ` • ${item.service.package_name}` : ""}`}
              searchQuery={searchQuery}
              className="text-xs text-muted-foreground ml-1 flex-1"
              numberOfLines={1}
            />
          </View>

          {/* Technician */}
          {item.technician && (
            <View className="flex-row items-center mb-0.5">
              <Ionicons name="construct-outline" size={12} color="hsl(var(--muted-foreground))" />
              <Text className="text-xs text-muted-foreground ml-1">
                {item.technician.profile?.full_name || item.technician.username}
              </Text>
            </View>
          )}

          {/* Created Time */}
          <View className="flex-row items-center mt-1.5">
            <Ionicons name="time-outline" size={11} color="hsl(var(--muted-foreground))" />
            <Text className="text-[11px] text-muted-foreground ml-1">
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["40%"]}
        title={item.title}
        description={`${item.customer.name} • ${item.priority}`}
        cancelLabel={t("ticket.cancelBtn")}
        actions={[
          {
            key: "detail",
            label: t("ticket.detailTitle"),
            onPress: handlePress,
            icon: <Ionicons name="eye-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "edit",
            label: t("ticket.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "delete",
            label: t("ticket.deleteBtn"),
            onPress: handleDelete,
            icon: <Ionicons name="trash-outline" size={20} color="hsl(var(--destructive))" />,
            variant: "destructive",
            isLoading: isDeleting,
            disabled: isDeleting,
          },
        ]}
      />
    </>
  );
}
