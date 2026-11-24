import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Card } from "@/src/components/global/card";
import { FormInput } from "@/src/components/global/form-input";
import { Text } from "@/src/components/global/text";
import { AsyncSelect } from "@/src/components/global/select-searchable";
import { TicketTypePriorityFields } from "@/src/components/screens/ticket/ticket-form-fields";

import { useCreateTicket } from "@/src/features/ticket/hooks";
import { createCreateTicketSchema, CreateTicketInput } from "@/src/features/ticket/schema";
import {
  fetchTicketCustomerOptions,
  fetchTicketServiceOptions,
  fetchTicketTechnicianOptions,
} from "@/src/features/ticket/form-helpers";
import { useLanguageStore, useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { appendFormDataFile } from "@/src/lib/form-data";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { useThemeColor } from "@/src/lib/theme-colors";
import { TicketPriority, TicketType } from "@/src/lib/types";

export default function TicketCreateScreen() {
  const { t } = useT();
  const colors = useThemeColor();
  const locale = useLanguageStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);
  const params = useLocalSearchParams<{ service_id?: string }>();

  const [type, setType] = useState<TicketType>("PROBLEM");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [photo, setPhoto] = useState<string | null>(null);

  const ticketSchema = useMemo(() => createCreateTicketSchema(locale), [locale]);

  const { control, handleSubmit, setValue, watch, clearErrors } = useForm<CreateTicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      service_id: params.service_id || "",
      customer_id: "",
      title: "",
      description: "",
      type: "PROBLEM",
      priority: "MEDIUM",
      assigned_to: isTeknisi ? user?.id || "" : "",
    },
  });

  const selectedServiceId = watch("service_id");

  const createTicket = useCreateTicket();

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const onSubmit = (data: CreateTicketInput) => {
    const cleanServiceId = data.service_id?.trim() || undefined;
    const cleanCustomerId = !cleanServiceId ? data.customer_id?.trim() || undefined : undefined;
    const cleanAssignedTo = isTeknisi ? user?.id : data.assigned_to?.trim() || undefined;
    const cleanDescription = data.description?.trim() || undefined;

    if (photo) {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("type", type);
      formData.append("priority", priority);
      if (cleanServiceId) formData.append("service_id", cleanServiceId);
      if (cleanCustomerId) formData.append("customer_id", cleanCustomerId);
      if (cleanAssignedTo) formData.append("assigned_to", cleanAssignedTo);
      if (cleanDescription) formData.append("description", cleanDescription);
      appendFormDataFile(formData, "image", photo, "ticket-evidence");

      createTicket.mutate(formData, {
        onSuccess: () => router.back(),
      });
      return;
    }

    const payload: CreateTicketInput = {
      ...data,
      title: data.title.trim(),
      type,
      priority,
      service_id: cleanServiceId,
      customer_id: cleanCustomerId,
      assigned_to: cleanAssignedTo,
      description: cleanDescription,
    };

    createTicket.mutate(payload, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("ticket.createTitle")} showBackButton>
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
              {t("ticket.problemDetails")}
            </Text>
            <View className="gap-y-3">
              <AsyncSelect
                control={control}
                name="service_id"
                label={t("ticket.serviceLabel")}
                placeholder={t("ticket.servicePlaceholder")}
                fetchOptions={fetchTicketServiceOptions}
                highlightSearch
                onSelectFullObject={() => {
                  setValue("customer_id", "");
                  clearErrors(["service_id", "customer_id"]);
                }}
              />

              {!selectedServiceId && (
                <AsyncSelect
                  control={control}
                  name="customer_id"
                  label={t("ticket.customerLabel")}
                  placeholder={t("ticket.customerPlaceholder")}
                  fetchOptions={fetchTicketCustomerOptions}
                  highlightSearch
                  onSelectFullObject={() => {
                    clearErrors(["service_id", "customer_id"]);
                  }}
                />
              )}

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
            </View>
          </Card>

          <Card className="rounded-xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("ticket.assignment")}
            </Text>
            <View className="gap-y-4">
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
                />
              )}
            </View>
          </Card>

          <Card className="rounded-xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-1">
              {t("ticket.evidenceTitle")}
            </Text>
            <Text className="text-xs text-muted-foreground mb-3">
              {t("ticket.evidenceHint")}
            </Text>

            {photo ? (
              <View className="relative aspect-[3/4] w-48 self-center rounded-xl overflow-hidden bg-muted border border-border">
                <Image
                  source={{ uri: photo }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                <TouchableOpacity
                  onPress={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-x-3">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleTakePhoto}
                  className="flex-1 h-20 rounded-xl border border-dashed border-border items-center justify-center"
                >
                  <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
                  <Text className="text-xs text-muted-foreground mt-1">
                    {t("ticket.cameraLabel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickPhoto}
                  className="flex-1 h-20 rounded-xl border border-dashed border-border items-center justify-center"
                >
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  <Text className="text-xs text-muted-foreground mt-1">
                    {t("ticket.galleryLabel")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </ScrollView>

        <View className="border-t border-border bg-background pt-3 pb-2">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={createTicket.isPending}
            className={`h-12 rounded-xl items-center justify-center ${
              !createTicket.isPending ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              weight="semibold"
              className={`text-base ${!createTicket.isPending ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {createTicket.isPending ? t("ticket.creating") : t("ticket.createBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
