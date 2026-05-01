import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

import { useCreateTicket } from "@/src/features/ticket/hooks";
import { createTicketSchema, CreateTicketInput } from "@/src/features/ticket/schema";
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

export default function TicketCreateScreen() {
  const { t } = useT();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ service_id?: string }>();

  const [type, setType] = useState<TicketType>("PROBLEM");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  const { control, handleSubmit, setValue, watch } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema) as any,
    defaultValues: {
      service_id: params.service_id || "",
      title: "",
      description: "",
      type: "PROBLEM",
      priority: "MEDIUM",
      assigned_to: "",
    },
  });

  const createTicket = useCreateTicket();

  // Fetch services for selector
  const fetchServices = async (search: string, page: number) => {
    const res = await api.get("/customer", { params: { search, page, limit: 10 } });
    const services = res.data?.data?.services || [];
    return {
      data: services.map((s: any) => ({
        label: `${s.customer?.name || "-"} - ${s.package_name}`,
        value: s.id,
      })),
      hasNextPage: res.data?.data?.pagination?.hasNextPage || false,
    };
  };

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

  const onSubmit = (data: CreateTicketInput) => {
    const payload = {
      ...data,
      type,
      priority,
      service_id: data.service_id || undefined,
      assigned_to: data.assigned_to || undefined,
      description: data.description || undefined,
    };

    createTicket.mutate(payload, {
      onSuccess: () => router.back(),
    });
  };

  const title = watch("title");
  const isValid = (title?.trim()?.length || 0) >= 5;

  return (
    <ScreenWrapper headerTitle={t("ticket.createTitle")} showBackButton>
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
            {/* Service Selector */}
            <AsyncSelect
              control={control}
              name="service_id"
              label={t("ticket.serviceLabel")}
              placeholder={t("ticket.servicePlaceholder")}
              fetchOptions={fetchServices}
              highlightSearch
            />

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
            disabled={!isValid || createTicket.isPending}
            className={`h-12 rounded-xl items-center justify-center ${
              isValid && !createTicket.isPending ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              weight="semibold"
              className={`text-base ${isValid && !createTicket.isPending ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {createTicket.isPending ? t("ticket.creating") : t("ticket.createBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
