import React, { useRef, useCallback, useMemo } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { Ticket, TicketPriority, TicketStatus } from "@/src/lib/types";
import { TICKET_STATUS_VARIANTS, TICKET_PRIORITY_VARIANTS } from "@/src/lib/ticket-constants";
import { formatRelativeTime } from "@/src/lib/format-date";
import { useThemeColor } from "@/src/lib/theme-colors";
interface TicketItemProps {
  item: Ticket;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export const TicketItem = React.memo(function TicketItem({ item, searchQuery = "", onDelete, isDeleting }: TicketItemProps) {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role !== "TENANT_TEKNISI";
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const statusLabelMap: Record<TicketStatus, string> = useMemo(() => ({
    OPEN: t("ticket.statusOpen"),
    IN_PROGRESS: t("ticket.statusInProgress"),
    RESOLVED: t("ticket.statusResolved"),
    CLOSED: t("ticket.statusClosed"),
  }), [t]);

  const priorityLabelMap: Record<TicketPriority, string> = useMemo(() => ({
    LOW: t("ticket.priorityLow"),
    MEDIUM: t("ticket.priorityMedium"),
    HIGH: t("ticket.priorityHigh"),
    URGENT: t("ticket.priorityUrgent"),
  }), [t]);

  const statusLabel = statusLabelMap[item.status] || item.status;
  const priorityLabel = priorityLabelMap[item.priority] || item.priority;

  const handlePress = useCallback(() => {
    router.push(`/ticket/${item.id}/detail` as any);
  }, [item.id]);

  const handleLongPress = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleEdit = useCallback(() => {
    bottomSheetRef.current?.close();
    router.push(`/ticket/${item.id}/edit` as any);
  }, [item.id]);

  const handleDelete = useCallback(() => {
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
  }, [item.id, onDelete, t]);

  return (
    <>
      <Card className="rounded-2xl mb-3 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center p-4"
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={250}
        >
          {/* Icon */}
          <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="document-text" size={24} color={colors.primary} />
          </View>

          <View className="flex-1 ml-3">
            {/* Priority + Status Badges */}
            <View className="flex-row items-center gap-x-2 mb-2">
            <Badge colorVariant={TICKET_PRIORITY_VARIANTS[item.priority] || "neutral"}>
              {priorityLabel}
            </Badge>
            <Badge colorVariant={TICKET_STATUS_VARIANTS[item.status] || "neutral"}>
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
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
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
              <Ionicons name="construct-outline" size={12} color={colors.textMuted} />
              <Text className="text-xs text-muted-foreground ml-1">
                {item.technician.profile?.full_name || item.technician.username}
              </Text>
            </View>
          )}

          {/* Created Time */}
          <View className="flex-row items-center mt-1.5">
            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
            <Text className="text-[11px] text-muted-foreground ml-1">
              {formatRelativeTime(item.created_at, locale)}
            </Text>
          </View>
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
            icon: <Ionicons name="eye-outline" size={20} color={colors.primary} />,
            variant: "default",
          },
          {
            key: "edit",
            label: t("ticket.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color={colors.primary} />,
            variant: "default",
          },
          ...(canDelete
            ? [
                {
                  key: "delete",
                  label: t("ticket.deleteBtn"),
                  onPress: handleDelete,
                  icon: <Ionicons name="trash-outline" size={20} color={colors.error} />,
                  variant: "destructive" as const,
                  isLoading: isDeleting,
                  disabled: isDeleting,
                },
              ]
            : []),
        ]}
      />
    </>
  );
});
