import React, { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
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

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { useCreateNode } from "@/src/features/network/hooks";
import { networkService } from "@/src/features/network/service";

interface OdpFormValues {
  name: string;
  address: string;
  slot: string;
  parent_id: string;
  notes: string;
}

export default function OdpCreateScreen() {
  const { t } = useT();
  const createNode = useCreateNode();
  const isSubmitting = createNode.isPending;
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);

  const odpSchema = z.object({
    name: z.string().min(1, t("odp.nameRequired")),
    address: z.string().optional(),
    slot: z.string().optional(),
    parent_id: z.string().optional(),
    notes: z.string().optional(),
  });

  const { control, handleSubmit, setValue, watch } = useForm<OdpFormValues>({
    resolver: zodResolver(odpSchema) as any,
    defaultValues: {
      name: "",
      address: "",
      slot: "",
      parent_id: "",
      notes: "",
    },
  });

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

  const onSubmit = (data: OdpFormValues) => {
    createNode.mutate(
      {
        type: "ODP",
        name: data.name,
        lat: location?.lat || "0",
        long: location?.lng || "0",
        address: data.address || undefined,
        slot: data.slot ? parseInt(data.slot, 10) : undefined,
        parent_id: data.parent_id || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  return (
    <ScreenWrapper headerTitle={t("odp.createTitle")} showBackButton>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-y-3">
            {/* Name */}
            <FormInput
              control={control}
              name="name"
              label={t("odp.nameLabel")}
              placeholder={t("odp.namePlaceholder")}
            />

            {/* Address + Map Picker */}
            <View>
              <Label>{t("odp.addressLabel")}</Label>
              <TouchableOpacity
                onPress={() => setShowMap(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <View className="ml-2 flex-1">
                    {watch("address") ? (
                      <Text className="text-foreground text-xs" numberOfLines={2}>
                        {watch("address")}
                      </Text>
                    ) : (
                      <Text className="text-muted-foreground">{t("odp.addressPlaceholder")}</Text>
                    )}
                  </View>
                </View>
                <View className="bg-primary/10 p-2 rounded-lg">
                  <Ionicons name="map" size={20} color="#1E40AF" />
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
              control={control}
              name="parent_id"
              label={t("odp.parentServerLabel")}
              placeholder={t("odp.parentServerPlaceholder")}
              fetchOptions={fetchServers}
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
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? t("odp.saving") : t("odp.saveBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
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
