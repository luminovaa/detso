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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Avatar } from "@/src/components/global/avatar";

import { useTicket, useTicketHistory, useDeleteTicket } from "@/src/features/ticket/hooks";
import { useT } from "@/src/features/i18n/store";
import { TicketStatus, TicketPriority, TicketAction } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";
import { formatRelativeTime } from "@/src/lib/format-date";
import { UpdateStatusSheet } from "@/src/components/screens/ticket/update-status-sheet";

import { COLORS } from '@/src/lib/colors';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom: safeBottom } = useSafeAreaInsets();
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
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
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

  return (
    <ScreenWrapper headerTitle={t("ticket.detailTitle")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: safeBottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Priority */}
        <Card className="mb-3 border-border/40">
          <View className="p-4">
            <View className="flex-row items-center gap-x-2 mb-2">
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
            <Text className="text-[11px] text-muted-foreground">
              {t("ticket.createdAt")}: {formatRelativeTime(ticket.created_at)}
            </Text>
          </View>
        </Card>

        {/* Problem Details */}
        <Card className="mb-3 border-border/40">
          <View className="p-4">
            <Text weight="semibold" className="text-sm text-muted-foreground mb-2">
              {t("ticket.problemDetails")}
            </Text>
            <Text weight="bold" className="text-lg text-foreground mb-1">
              {ticket.title}
            </Text>
            {ticket.description && (
              <Text className="text-sm text-muted-foreground leading-5">
                {ticket.description}
              </Text>
            )}
          </View>
        </Card>

        {/* Customer Info */}
        {ticket.service?.customer && (
          <Card className="mb-3 border-border/40">
            <View className="p-4">
              <Text weight="semibold" className="text-sm text-muted-foreground mb-3">
                {t("ticket.customerInfo")}
              </Text>

              <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={16} color={COLORS.neutral.gray[500]} />
                <Text weight="medium" className="text-sm text-foreground ml-2">
                  {ticket.service.customer.name}
                </Text>
              </View>

              {ticket.service.customer.phone && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="call-outline" size={16} color={COLORS.neutral.gray[500]} />
                  <Text className="text-sm text-muted-foreground ml-2">
                    {ticket.service.customer.phone}
                  </Text>
                </View>
              )}

              {ticket.service.address && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="location-outline" size={16} color={COLORS.neutral.gray[500]} />
                  <Text className="text-sm text-muted-foreground ml-2 flex-1">
                    {ticket.service.address}
                  </Text>
                </View>
              )}

              {ticket.service.package_name && (
                <View className="flex-row items-center">
                  <Ionicons name="wifi-outline" size={16} color={COLORS.neutral.gray[500]} />
                  <Text className="text-sm text-muted-foreground ml-2">
                    {ticket.service.package_name}
                    {ticket.service.package_speed ? ` (${ticket.service.package_speed})` : ""}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Assignment */}
        <Card className="mb-3 border-border/40">
          <View className="p-4">
            <Text weight="semibold" className="text-sm text-muted-foreground mb-3">
              {t("ticket.assignment")}
            </Text>

            {ticket.schedule?.technician ? (
              <View className="flex-row items-center">
                <Avatar
                  src={ticket.schedule.technician.avatar}
                  alt={ticket.schedule.technician.full_name || ticket.schedule.technician.username}
                  size="sm"
                />
                <View className="ml-2">
                  <Text weight="medium" className="text-sm text-foreground">
                    {ticket.schedule.technician.full_name || ticket.schedule.technician.username}
                  </Text>
                  {ticket.schedule && (
                    <Text className="text-xs text-muted-foreground">
                      {new Date(ticket.schedule.start_time).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground italic">
                {t("ticket.unassigned")}
              </Text>
            )}
          </View>
        </Card>

        {/* Timeline */}
        {histories.length > 0 && (
          <Card className="mb-3 border-border/40">
            <View className="p-4">
              <Text weight="semibold" className="text-sm text-muted-foreground mb-3">
                {t("ticket.timeline")}
              </Text>

              {histories.map((history: any, index: number) => (
                <View
                  key={history.id}
                  className={`flex-row ${index < histories.length - 1 ? "mb-4" : ""}`}
                >
                  {/* Timeline dot + line */}
                  <View className="items-center mr-3">
                    <View className="w-7 h-7 rounded-full bg-muted items-center justify-center">
                      <Ionicons
                        name={getActionIcon(history.action) as any}
                        size={14}
                        color={COLORS.neutral.gray[500]}
                      />
                    </View>
                    {index < histories.length - 1 && (
                      <View className="w-0.5 flex-1 bg-border mt-1" />
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1 pb-1">
                    <Text weight="medium" className="text-sm text-foreground">
                      {history.action.replace(/_/g, " ")}
                    </Text>
                    {history.description && (
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {history.description}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      {history.created_by && (
                        <Text className="text-[11px] text-muted-foreground">
                          {history.created_by.full_name || history.created_by.username}
                          {" • "}
                        </Text>
                      )}
                      <Text className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(history.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View
        className="border-t border-border bg-background px-6 pt-3"
        style={{ paddingBottom: safeBottom + 12 }}
      >
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUpdateStatus}
            className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"
          >
            <Text weight="semibold" className="text-sm text-primary-foreground">
              {t("ticket.updateStatus")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEdit}
            className="h-11 w-11 rounded-xl bg-muted items-center justify-center"
          >
            <Ionicons name="pencil-outline" size={18} color={COLORS.neutral.gray[900]} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDelete}
            className="h-11 w-11 rounded-xl bg-destructive/10 items-center justify-center"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.status.error} />
          </TouchableOpacity>
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
