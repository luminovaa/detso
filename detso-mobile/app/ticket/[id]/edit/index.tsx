import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { FormInput } from "@/src/components/global/form-input";
import { Text } from "@/src/components/global/text";
import { AsyncSelect } from "@/src/components/global/select-searchable";
import { Card } from "@/src/components/global/card";
import { TicketTypePriorityFields } from "@/src/components/screens/ticket/ticket-form-fields";

import { useTicket, useUpdateTicket } from "@/src/features/ticket/hooks";
import { createUpdateTicketSchema, UpdateTicketInput } from "@/src/features/ticket/schema";
import { fetchTicketTechnicianOptions } from "@/src/features/ticket/form-helpers";
import { useLanguageStore, useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { TicketPriority, TicketType } from "@/src/lib/types";
import { useThemeColor } from "@/src/lib/theme-colors";

export default function TicketEditScreen() {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();

  const { data: ticketRes, isLoading } = useTicket(id);
  const updateTicket = useUpdateTicket();
  const ticket = ticketRes?.data?.ticket;

  const [type, setType] = useState<TicketType>("PROBLEM");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  const editSchema = useMemo(() => createUpdateTicketSchema(locale), [locale]);

  const { control, handleSubmit, setValue, reset } = useForm<UpdateTicketInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "PROBLEM",
      priority: "MEDIUM",
      assigned_to: "",
    },
  });

  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title || "",
        description: ticket.description || "",
        type: ticket.type || "PROBLEM",
        priority: ticket.priority || "MEDIUM",
        assigned_to: ticket.assigned_to || "",
      });
      setType(ticket.type || "PROBLEM");
      setPriority(ticket.priority || "MEDIUM");
    }
  }, [ticket, reset]);

  const onSubmit = (data: UpdateTicketInput) => {
    updateTicket.mutate(
      {
        id,
        data: {
          title: data.title || undefined,
          description: data.description || undefined,
          type,
          priority,
          // Teknisi cannot reassign or unassign tickets ("khusus yang ditugaskan")
          assigned_to: isTeknisi ? undefined : data.assigned_to || undefined,
        },
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("ticket.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="rounded-xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("ticket.editTitle")}
            </Text>
            <View className="gap-y-3">
              <FormInput
                control={control}
                name="title"
                label={t("ticket.titleLabel")}
                placeholder={t("ticket.titlePlaceholder")}
              />

              <FormInput
                control={control}
                name="description"
                label={t("ticket.descriptionLabel")}
                placeholder={t("ticket.descriptionPlaceholder")}
                isTextarea
                numberOfLines={4}
              />

              <TicketTypePriorityFields
                type={type}
                priority={priority}
                onSelectType={(value) => {
                  setType(value);
                  setValue("type", value);
                }}
                onSelectPriority={(value) => {
                  setPriority(value);
                  setValue("priority", value);
                }}
              />

              {!isTeknisi && (
                <AsyncSelect
                  control={control}
                  name="assigned_to"
                  label={t("ticket.assignToLabel")}
                  placeholder={t("ticket.assignToPlaceholder")}
                  fetchOptions={fetchTicketTechnicianOptions}
                  highlightSearch
                  initialLabel={
                    ticket?.technician?.profile?.full_name ||
                    ticket?.technician?.username ||
                    ticket?.schedule?.technician?.full_name ||
                    ""
                  }
                />
              )}
            </View>
          </Card>
        </ScrollView>

        <View className="border-t border-border bg-background pt-3 pb-2">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={updateTicket.isPending}
            className={`h-12 rounded-xl items-center justify-center ${
              !updateTicket.isPending ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              weight="semibold"
              className={`text-base ${!updateTicket.isPending ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {updateTicket.isPending ? t("ticket.updating") : t("ticket.saveBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
