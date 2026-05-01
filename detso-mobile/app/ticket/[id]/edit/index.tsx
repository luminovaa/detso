import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { FormInput } from "@/src/components/global/form-input";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { AsyncSelect } from "@/src/components/global/select-searchable";

import { useTicket, useUpdateTicket } from "@/src/features/ticket/hooks";
import { updateTicketSchema, UpdateTicketInput } from "@/src/features/ticket/schema";
import { useT } from "@/src/features/i18n/store";
import { TicketPriority, TicketType } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";
import api from "@/src/lib/api";

const PRIORITY_OPTIONS: { value: TicketPriority; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: "LOW", labelKey: "ticket.priorityLow", variant: "neutral" },
  { value: "MEDIUM", labelKey: "ticket.priorityMedium", variant: "info" },
  { value: "HIGH", labelKey: "ticket.priorityHigh", variant: "warning" },
  { value: "URGENT", labelKey: "ticket.priorityUrgent", variant: "error" },
];

const TYPE_OPTIONS: { value: TicketType; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: "PROBLEM", labelKey: "ticket.typeProblem", variant: "error" },
  { value: "UPGRADE", labelKey: "ticket.typeUpgrade", variant: "success" },
  { value: "DOWNGRADE", labelKey: "ticket.typeDowngrade", variant: "warning" },
];

export default function TicketEditScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom: safeBottom } = useSafeAreaInsets();

  const { data: ticketRes, isLoading } = useTicket(id);
  const updateTicket = useUpdateTicket();

  const ticket = ticketRes?.data?.ticket;

  const [type, setType] = useState<TicketType>("PROBLEM");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  const { control, handleSubmit, setValue, watch, reset } = useForm<UpdateTicketInput>({
    resolver: zodResolver(updateTicketSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "PROBLEM",
      priority: "MEDIUM",
      assigned_to: "",
    },
  });

  // Pre-fill form when ticket data loads
  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title || "",
        description: ticket.description || "",
        type: ticket.type || "PROBLEM",
        priority: ticket.priority || "MEDIUM",
        assigned_to: "",
      });
      setType(ticket.type || "PROBLEM");
      setPriority(ticket.priority || "MEDIUM");
    }
  }, [ticket, reset]);

  // Fetch technicians for selector
  const fetchTechnicians = async (search: string, page: number) => {
    const res = await api.get("/user", { params: { search, page, limit: 10, role: "TENANT_TEKNISI" } });
    const users = res.data?.data?.users || [];
    return {
      data: users.map((u: any) => ({
        label: u.profile?.full_name || u.username,
        value: u.id,
      })),
      hasNextPage: res.data?.data?.pagination?.hasNextPage || false,
    };
  };

  const onSubmit = (data: UpdateTicketInput) => {
    updateTicket.mutate(
      {
        id,
        data: {
          title: data.title || undefined,
          description: data.description || undefined,
          type,
          priority,
          assigned_to: data.assigned_to || undefined,
        },
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const title = watch("title");
  const isValid = (title?.trim()?.length || 0) >= 5;

  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("ticket.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="hsl(var(--primary))" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("ticket.editTitle")} showBackButton>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-y-3">
            {/* Title */}
            <FormInput
              control={control}
              name="title"
              label={t("ticket.titleLabel")}
              placeholder={t("ticket.titlePlaceholder")}
            />

            {/* Description */}
            <FormInput
              control={control}
              name="description"
              label={t("ticket.descriptionLabel")}
              placeholder={t("ticket.descriptionPlaceholder")}
              isTextarea
              numberOfLines={4}
            />

            {/* Type Selector */}
            <View>
              <Text weight="medium" className="text-sm text-foreground mb-2">
                {t("ticket.typeLabel")}
              </Text>
              <View className="flex-row gap-x-2">
                {TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    onPress={() => {
                      setType(option.value);
                      setValue("type", option.value);
                    }}
                  >
                    <Badge
                      colorVariant={type === option.value ? option.variant : "neutral"}
                      className={`px-4 py-1.5 ${type === option.value ? "opacity-100" : "opacity-50"}`}
                    >
                      {t(option.labelKey)}
                    </Badge>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Selector */}
            <View>
              <Text weight="medium" className="text-sm text-foreground mb-2">
                {t("ticket.priorityLabel")}
              </Text>
              <View className="flex-row gap-x-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPriority(option.value);
                      setValue("priority", option.value);
                    }}
                  >
                    <Badge
                      colorVariant={priority === option.value ? option.variant : "neutral"}
                      className={`px-4 py-1.5 ${priority === option.value ? "opacity-100" : "opacity-50"}`}
                    >
                      {t(option.labelKey)}
                    </Badge>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Assign to Technician */}
            <AsyncSelect
              control={control}
              name="assigned_to"
              label={t("ticket.assignToLabel")}
              placeholder={t("ticket.assignToPlaceholder")}
              fetchOptions={fetchTechnicians}
              highlightSearch
              initialLabel={ticket?.schedule?.technician?.full_name || ""}
            />
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="border-t border-border bg-background px-6 pt-4"
          style={{ paddingBottom: safeBottom + 16 }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || updateTicket.isPending}
            className={`h-12 rounded-xl items-center justify-center ${
              isValid && !updateTicket.isPending ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              weight="semibold"
              className={`text-base ${isValid && !updateTicket.isPending ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {updateTicket.isPending ? t("ticket.updating") : t("ticket.saveBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
