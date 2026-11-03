import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Label } from "@/src/components/global/label";
import { AsyncSelect } from "@/src/components/global/select-searchable";
import { MapLocationPicker } from "@/src/components/global/map-picker";
import { Card } from "@/src/components/global/card";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useNetworkNode, useEditNode } from "@/src/features/network/hooks";
import { networkService } from "@/src/features/network/service";
import { useThemeColor } from '@/src/lib/theme-colors';

interface OdpFormValues {
  name: string;
  address: string;
  slot: string;
  parent_id: string;
  notes: string;
}

export default function OdpEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const colors = useThemeColor();
  const { data, isLoading } = useNetworkNode(id);
  const editNode = useEditNode();
  const isSubmitting = editNode.isPending;
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);

  const node = data?.data;

  const odpSchema = z.object({
    name: z.string().min(1, t("odp.nameRequired")),
    address: z.string().optional(),
    slot: z.string().optional(),
    parent_id: z.string().optional(),
    notes: z.string().optional(),
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm<OdpFormValues>({
    resolver: zodResolver(odpSchema) as any,
    defaultValues: {
      name: "",
      address: "",
      slot: "",
      parent_id: "",
      notes: "",
    },
  });

  // Pre-fill form when data loads
  useEffect(() => {
    if (node) {
      reset({
        name: node.name || "",
        address: node.address || "",
        slot: node.slot ? String(node.slot) : "",
        parent_id: node.parent_id || "",
        notes: node.notes || "",
      });
      if (node.lat && node.long) {
        setLocation({ lat: node.lat, lng: node.long });
      }
    }
  }, [node, reset]);

  const fetchServers = useCallback(
    async (search: string, _page: number) => {
      const res = await networkService.getNodes({ type: "SERVER" });
      const nodes = res?.data?.nodes || [];
      const filtered = search
        ? nodes.filter((n: any) =>
            n.name.toLowerCase().includes(search.toLowerCase())
          )
        : nodes;
      return {
        data: filtered.map((n: any) => ({
          label: `${n.name}${n.address ? ` • ${n.address}` : ""}`,
          value: n.id,
        })),
        hasNextPage: false,
      };
    },
    []
  );

  const onSubmit = (formData: OdpFormValues) => {
    editNode.mutate(
      {
        id,
        data: {
          name: formData.name,
          lat: location?.lat || node?.lat || undefined,
          long: location?.lng || node?.long || undefined,
          address: formData.address || null,
          slot: formData.slot ? parseInt(formData.slot, 10) : null,
          parent_id: formData.parent_id || null,
          notes: formData.notes || null,
        },
      },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("odp.editTitle")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={t("odp.editTitle")} showBackButton>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="rounded-2xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("odp.editTitle")}
            </Text>
            <View className="gap-y-3">
              {/* Name */}
              <FormInput
                control={control}
                name="name"
                label={t("odp.nameLabel")}
                placeholder={t("odp.namePlaceholder")}
              />


              <FormInput
                control={control}
                name="address"
                label={t("odp.addressLabel")}
                placeholder={t("odp.addressPlaceholder")}
              />
              {/* Address + Map Picker */}
              <View>
                <Label>{t("odp.addressLabel")}</Label>
                <TouchableOpacity
                  onPress={() => setShowMap(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1 min-h-11"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="location-outline" size={20} color={colors.icon} />
                    <View className="ml-2 flex-1">
                      {watch("address") || location ? (
                        <View>
                          <Text className="text-foreground text-xs" numberOfLines={2}>
                            {watch("address") || t("odp.addressPlaceholder")}
                          </Text>
                          {location && (
                            <Text className="text-muted-foreground text-[10px] mt-1">
                              {location.lat}, {location.lng}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text className="text-muted-foreground">{t("odp.addressPlaceholder")}</Text>
                      )}
                    </View>
                  </View>
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <Ionicons name="map" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Slot Capacity */}
              <FormInput
                control={control}
                name="slot"
                label={t("odp.slotLabel")}
                placeholder={t("odp.slotPlaceholder")}
                keyboardType="numeric"
              />

              {/* Parent Server */}
              <AsyncSelect
                key={`server-${node?.id}`}
                control={control}
                name="parent_id"
                label={t("odp.parentServerLabel")}
                placeholder={t("odp.parentServerPlaceholder")}
                fetchOptions={fetchServers}
                initialLabel={node?.parent?.name || ""}
                highlightSearch
              />

              {/* Notes */}
              <FormInput
                control={control}
                name="notes"
                label={t("odp.notesLabel")}
                placeholder={t("odp.notesPlaceholder")}
                isTextarea
              />
            </View>
          </Card>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="pt-3 pb-2 border-t border-border/10 bg-background"
        >
          <Button
            title={isSubmitting ? t("odp.saving") : t("odp.saveBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          setLocation({ lat: lat.toString(), lng: lng.toString() });
          if (addressText) {
            setValue("address", addressText);
          }
        }}
        initialAddress={watch("address")}
      />
    </ScreenWrapper>
  );
}
