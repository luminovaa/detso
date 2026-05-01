import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Avatar } from "@/src/components/global/avatar";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { Label } from "@/src/components/global/label";
import { showToast } from "@/src/components/global/toast";
import { MapLocationPicker } from "@/src/components/global/map-picker";
import { FormSkeleton } from "@/src/components/global/form-skeleton";

import { useAuthStore } from "@/src/features/auth/store";
import {
  updateTenantSchema,
  UpdateTenantInput,
} from "@/src/features/tenant/schema";
import { Tenant } from "@/src/lib/types";
import { useTenant, useUpdateTenant } from "@/src/features/tenant/hooks";

export default function EditTenantScreen() {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id;

  const { data: tenantResponse, isLoading: isFetching } = useTenant(tenantId!);
  const tenant = tenantResponse?.data as Tenant | undefined;
  const updateTenant = useUpdateTenant();
  const isSubmitting = updateTenant.isPending;

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<UpdateTenantInput>({
      resolver: zodResolver(updateTenantSchema),
    });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        address: tenant.address || "",
        phone: tenant.phone || "",
        lat: tenant.lat || "",
        long: tenant.long || "",
      });
    }
  }, [tenant, reset]);

  const onSubmit = async (data: UpdateTenantInput) => {
    if (!tenantId) return;

    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    formData.append("address", data.address || "");
    formData.append("phone", data.phone || "");
    if (data.lat) formData.append("lat", data.lat);
    if (data.long) formData.append("long", data.long);

    if (selectedLogo) {
      const uri = selectedLogo.uri;
      const uriParts = uri.split(".");
      const extension = uriParts[uriParts.length - 1].toLowerCase();
      const mimeType = extension === "jpg" ? "jpeg" : extension;

      // @ts-ignore - React Native FormData accepts this format
      formData.append("image", {
        uri: uri,
        name: `logo-update-${Date.now()}.${extension}`,
        type: `image/${mimeType}`,
      });
    }

    updateTenant.mutate(
      { id: tenantId, data: formData },
      {
        onSuccess: () => {
          showToast.success("Berhasil", "Profil ISP berhasil diperbarui");
          router.back();
        },
      },
    );
  };

  if (!tenantId) {
    return (
      <ScreenWrapper headerTitle="Edit Profil ISP" showBackButton>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Tenant tidak ditemukan</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isFetching) {
    return (
      <ScreenWrapper headerTitle="Edit Profil ISP" showBackButton isLoading>
        <FormSkeleton fieldCount={4} showAvatar showMap />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle="Edit Profil ISP" showBackButton>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={() => setShowImagePicker(true)}
              activeOpacity={0.7}
              className="relative"
            >
              <View className="p-1 rounded-[45px] border-2 border-dashed border-primary/30">
                <Avatar
                  src={selectedLogo?.uri || tenant?.logo}
                  alt={tenant?.name || "Logo ISP"}
                  size="2xl"
                  className="bg-primary/5 rounded-[40px]"
                />
              </View>
              <View className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-background">
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <Text weight="semibold" className="text-foreground mt-4 text-sm">
              Logo Perusahaan
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-y-3">
            <Text weight="bold" className="text-lg mb-1">
              Informasi Perusahaan
            </Text>

            <FormInput
              control={control}
              name="name"
              label="Nama Perusahaan"
              placeholder="PT Internet Cepat"
            />

            <FormInput
              control={control}
              name="phone"
              label="Telepon"
              placeholder="08123456789"
              keyboardType="phone-pad"
            />

            {/* Location Picker */}
            <View>
              <Label>Lokasi</Label>
              <TouchableOpacity
                onPress={() => setShowMap(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <View className="ml-2 flex-1">
                    {watch("address") ? (
                      <View>
                        <Text className="text-foreground text-xs" numberOfLines={2}>
                          {watch("address")}
                        </Text>
                        <Text className="text-muted-foreground text-[10px] mt-1">
                          {watch("lat")}, {watch("long")}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-muted-foreground">
                        Pilih lokasi di peta
                      </Text>
                    )}
                  </View>
                </View>
                <View className="bg-primary/10 p-2 rounded-lg">
                  <Ionicons name="map" size={20} color="#1E40AF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? "Menyimpan..." : "Simpan"}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(uri, base64) => setSelectedLogo({ uri, base64 })}
        aspectRatio="1:1"
      />

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          setValue("lat", lat.toString());
          setValue("long", lng.toString());
          if (addressText) {
            setValue("address", addressText);
          }
        }}
        initialCoordinate={
          watch("lat") && watch("long")
            ? {
                latitude: parseFloat(watch("lat")!),
                longitude: parseFloat(watch("long")!),
              }
            : null
        }
        initialAddress={watch("address")}
      />
    </ScreenWrapper>
  );
}
