import React, { useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Avatar } from "@/src/components/global/avatar";

import { useTicket, useTicketHistory, useDeleteTicket } from "@/src/features/ticket/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { TicketStatus, TicketPriority, TicketAction } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";
import { formatRelativeTime } from "@/src/lib/format-date";
import { UpdateStatusSheet } from "@/src/components/screens/ticket/update-status-sheet";

import { useThemeColor } from "@/src/lib/theme-colors";
const getStatusVariant = (status: TicketStatus): BadgeVariantKey => {
  switch (status) {
    case "OPEN": return "info";
    case "IN_PROGRESS": return "warning";
    case "RESOLVED": return "success";
    case "CLOSED": return "neutral";
    default: return "neutral";
  }
};

const getPriorityVariant = (priority: TicketPriority): BadgeVariantKey => {
  switch (priority) {
    case "LOW": return "neutral";
    case "MEDIUM": return "info";
    case "HIGH": return "warning";
    case "URGENT": return "error";
    default: return "neutral";
  }
};

const getActionIcon = (action: TicketAction): string => {
  switch (action) {
    case "CREATED": return "add-circle-outline";
    case "ASSIGNED": return "person-add-outline";
    case "STATUS_CHANGED": return "swap-horizontal-outline";
    case "PRIORITY_CHANGED": return "flag-outline";
    case "RESOLVED": return "checkmark-circle-outline";
    case "CLOSED": return "close-circle-outline";
    case "REOPENED": return "refresh-outline";
    case "SCHEDULED": return "calendar-outline";
    case "NOTE_ADDED": return "chatbubble-outline";
    case "UPDATED": return "create-outline";
    default: return "ellipse-outline";
  }
};

export default function TicketDetailScreen() {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role !== "TENANT_TEKNISI";
  const { id } = useLocalSearchParams<{ id: string }>();
  const statusSheetRef = useRef<BottomSheetModal>(null);
  const { data: ticketRes, isLoading: ticketLoading } = useTicket(id);
  const { data: historyRes } = useTicketHistory(id);
  const deleteTicket = useDeleteTicket();

  const ticket = ticketRes?.data?.ticket;
  const histories = historyRes?.data?.histories || [];

  const handleUpdateStatus = () => {
    statusSheetRef.current?.present();
  };

  const handleEdit = () => {
    router.push(`/ticket/${id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      t("ticket.deleteConfirm"),
      t("ticket.deleteMessage"),
      [
        { text: t("ticket.cancelBtn"), style: "cancel" },
        {
          text: t("ticket.deleteBtn"),
          style: "destructive",
          onPress: () => {
            deleteTicket.mutate(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  };

  if (ticketLoading) {
    return (
      <ScreenWrapper headerTitle={t("ticket.detailTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!ticket) {
    return (
      <ScreenWrapper headerTitle={t("ticket.detailTitle")} showBackButton>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center">Ticket not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusLabelMap: Record<string, string> = {
    OPEN: t("ticket.statusOpen"),
    IN_PROGRESS: t("ticket.statusInProgress"),
    RESOLVED: t("ticket.statusResolved"),
    CLOSED: t("ticket.statusClosed"),
  };

  const priorityLabelMap: Record<string, string> = {
    LOW: t("ticket.priorityLow"),
    MEDIUM: t("ticket.priorityMedium"),
    HIGH: t("ticket.priorityHigh"),
    URGENT: t("ticket.priorityUrgent"),
  };

  const statusLabel = statusLabelMap[ticket.status] || ticket.status;
  const priorityLabel = priorityLabelMap[ticket.priority] || ticket.priority;
  const customerRows: { label: string; value: string }[] = [];
  if (ticket.service?.customer) {
    customerRows.push({
      label: t("customer.nameLabel") || "Nama",
      value: ticket.service.customer.name,
    });
    if (ticket.service.customer.phone) {
      customerRows.push({
        label: t("isp.phone"),
        value: ticket.service.customer.phone,
      });
    }
    if (ticket.service.address) {
      customerRows.push({
        label: t("isp.address"),
        value: ticket.service.address,
      });
    }
    if (ticket.service.package_name) {
      customerRows.push({
        label: t("package.title") || "Paket",
        value: `${ticket.service.package_name}${ticket.service.package_speed ? ` (${ticket.service.package_speed})` : ""}`,
      });
    }
  }

  return (
    <ScreenWrapper headerTitle={t("ticket.detailTitle")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Hero Header */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-6">
          <View className="flex-row items-center flex-wrap gap-2 mb-3">
            <Badge colorVariant={getPriorityVariant(ticket.priority)}>
              {priorityLabel}
            </Badge>
            <Badge colorVariant={getStatusVariant(ticket.status)}>
              {statusLabel}
            </Badge>
            {ticket.type && (
              <Badge colorVariant={ticket.type === "PROBLEM" ? "error" : ticket.type === "UPGRADE" ? "success" : "warning"}>
                {t(`ticket.type${ticket.type.charAt(0) + ticket.type.slice(1).toLowerCase()}`)}
              </Badge>
            )}
          </View>
          <Text weight="bold" className="text-lg text-foreground mb-1">
            {ticket.title}
          </Text>
          {ticket.description ? (
            <Text className="text-sm text-muted-foreground leading-5 mb-3">
              {ticket.description}
            </Text>
          ) : null}
          <Text className="text-xs text-muted-foreground">
            {t("ticket.createdAt")}: {formatRelativeTime(ticket.created_at)}
          </Text>
        </View>

        {/* Ticket Metadata Grouped Info */}
        <GroupedSection title={t("ticket.problemDetails")}>
          <View className="flex-row items-center justify-between px-4 py-3.5 gap-3 border-b border-border/60">
            <Text className="text-sm text-muted-foreground">{t("ticket.statusLabel") || "Status"}</Text>
            <Badge colorVariant={getStatusVariant(ticket.status)}>{statusLabel}</Badge>
          </View>
          <View className="flex-row items-center justify-between px-4 py-3.5 gap-3 border-b border-border/60">
            <Text className="text-sm text-muted-foreground">{t("ticket.priorityLabel") || "Prioritas"}</Text>
            <Badge colorVariant={getPriorityVariant(ticket.priority)}>{priorityLabel}</Badge>
          </View>
          <View className="flex-row items-center justify-between px-4 py-3.5 gap-3">
            <Text className="text-sm text-muted-foreground">{t("ticket.createdAt")}</Text>
            <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
              {formatRelativeTime(ticket.created_at)}
            </Text>
          </View>
        </GroupedSection>

        {/* Customer Info */}
        {customerRows.length > 0 && (
          <GroupedSection title={t("ticket.customerInfo")}>
            {customerRows.map((row, idx) => {
              const isLast = idx === customerRows.length - 1;
              return (
                <View
                  key={row.label}
                  className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
                >
                  <Text className="text-sm text-muted-foreground">{row.label}</Text>
                  <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
                    {row.value}
                  </Text>
                </View>
              );
            })}
          </GroupedSection>
        )}

        {/* Assignment */}
        <GroupedSection title={t("ticket.assignment")}>
          {ticket.schedule?.technician ? (
            <>
              <View
                className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${ticket.schedule.start_time ? "border-b border-border/60" : ""}`}
              >
                <Text className="text-sm text-muted-foreground">{t("ticket.assignment")}</Text>
                <View className="flex-row items-center justify-end flex-1 gap-2">
                  <Avatar
                    src={ticket.schedule.technician.avatar}
                    alt={ticket.schedule.technician.full_name || ticket.schedule.technician.username}
                    size="sm"
                  />
                  <Text weight="semibold" className="text-sm text-foreground text-right">
                    {ticket.schedule.technician.full_name || ticket.schedule.technician.username}
                  </Text>
                </View>
              </View>
              {ticket.schedule.start_time && (
                <View className="flex-row items-center justify-between px-4 py-3.5 gap-3">
                  <Text className="text-sm text-muted-foreground">Jadwal</Text>
                  <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
                    {new Date(ticket.schedule.start_time).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="flex-row items-center justify-between px-4 py-3.5 gap-3">
              <Text className="text-sm text-muted-foreground">{t("ticket.assignment")}</Text>
              <Text weight="semibold" className="text-sm text-muted-foreground italic text-right flex-1">
                {t("ticket.unassigned")}
              </Text>
            </View>
          )}
        </GroupedSection>

        {/* Timeline */}
        {histories.length > 0 && (
          <GroupedSection title={t("ticket.timeline")}>
            {histories.map((history: any, index: number) => {
              const isLast = index === histories.length - 1;
              return (
                <View
                  key={history.id}
                  className={`flex-row items-start justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
                >
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mt-0.5">
                    <Ionicons
                      name={getActionIcon(history.action) as any}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text weight="semibold" className="text-sm text-foreground">
                      {history.action.replace(/_/g, " ")}
                    </Text>
                    {history.description && (
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {history.description}
                      </Text>
                    )}
                    {history.created_by && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        {history.created_by.full_name || history.created_by.username}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground text-right">
                    {formatRelativeTime(history.created_at)}
                  </Text>
                </View>
              );
            })}
          </GroupedSection>
        )}
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View
        className="border-t border-border bg-background pt-3 pb-2"
      >
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUpdateStatus}
            className="flex-1 min-h-11 h-11 rounded-xl bg-primary items-center justify-center"
          >
            <Text weight="semibold" className="text-sm text-primary-foreground">
              {t("ticket.updateStatus")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEdit}
            className="min-h-11 min-w-11 h-11 w-11 rounded-xl bg-muted items-center justify-center"
          >
            <Ionicons name="pencil-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          {canDelete && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDelete}
              className="min-h-11 min-w-11 h-11 w-11 rounded-xl bg-destructive/10 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Update Status Sheet */}
      <UpdateStatusSheet
        ref={statusSheetRef}
        ticketId={id}
        currentStatus={ticket.status}
      />
    </ScreenWrapper>
  );
}
