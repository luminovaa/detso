import React from "react";
import { View, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { FormInput } from "@/src/components/global/form-input";
import { FormDatePicker } from "@/src/components/global/date-picker";
import { AsyncSelect, SelectOption } from "@/src/components/global/select-searchable";
import { PhotoUploadBox } from "./photo-upload-box";

import { useT } from "@/src/features/i18n/store";
import { CreateCustomerInput } from "@/src/features/customer/schema";
import {
  CustomerPhotoState,
  fetchPackageSelectOptions,
} from "@/src/features/customer/form-helpers";
import { useThemeColor } from "@/src/lib/theme-colors";

interface CustomerCreateStepsProps {
  currentStep: number;
  control: Control<CreateCustomerInput>;
  setValue: UseFormSetValue<CreateCustomerInput>;
  watch: UseFormWatch<CreateCustomerInput>;
  sameAddress: boolean;
  onToggleSameAddress: (val: boolean) => void;
  onOpenMap: () => void;
  nikChecking: boolean;
  existingCustomer: { id: string; name: string } | null;
  ktpPhoto: CustomerPhotoState | null;
  photoFront: CustomerPhotoState | null;
  photoSide: CustomerPhotoState | null;
  photoFar: CustomerPhotoState | null;
  photoCustomer: CustomerPhotoState | null;
  photoDevice: CustomerPhotoState | null;
  onPickKtp: () => void;
  onPickFront: () => void;
  onPickSide: () => void;
  onPickFar: () => void;
  onPickCustomer: () => void;
  onPickDevice: () => void;
}

export function CustomerCreateSteps({
  currentStep,
  control,
  setValue,
  watch,
  sameAddress,
  onToggleSameAddress,
  onOpenMap,
  nikChecking,
  existingCustomer,
  ktpPhoto,
  photoFront,
  photoSide,
  photoFar,
  photoCustomer,
  photoDevice,
  onPickKtp,
  onPickFront,
  onPickSide,
  onPickFar,
  onPickCustomer,
  onPickDevice,
}: CustomerCreateStepsProps) {
  const { t } = useT();
  const colors = useThemeColor();
  const packageId = watch("package_id");
  const latValue = watch("lat");
  const longValue = watch("long");
  const addressServiceValue = watch("address_service");

  const handleSelectPackage = (item: SelectOption) => {
    if (typeof item.name === "string") setValue("package_name", item.name);
    if (typeof item.speed === "string") setValue("package_speed", item.speed);
    if (typeof item.price === "number") setValue("package_price", item.price);
  };

  if (currentStep === 1) {
    return (
      <>
        <Card className="rounded-xl p-4 mb-4">
          <Text weight="bold" className="text-base text-foreground mb-1">
            {t("customer.ktpLabel")}
          </Text>
          <View className="gap-y-3">
            <PhotoUploadBox
              hint={t("customer.ktpHint")}
              emptyText={t("customer.photoHint")}
              photo={ktpPhoto}
              onPress={onPickKtp}
              iconName="id-card-outline"
            />

            <FormInput
              control={control}
              name="nik"
              label={t("customer.nikLabel")}
              placeholder={t("customer.nikPlaceholder")}
              keyboardType="numeric"
              maxLength={16}
            />

            {nikChecking && (
              <View className="flex-row items-center gap-x-2 px-1">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-xs text-muted-foreground">Memeriksa NIK...</Text>
              </View>
            )}

            {existingCustomer && !nikChecking && (
              <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <View className="flex-row items-center gap-x-2 mb-2">
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text weight="semibold" className="text-sm text-primary">
                    NIK Sudah Terdaftar
                  </Text>
                </View>
                <Text className="text-sm text-foreground">
                  Customer <Text weight="bold">{existingCustomer.name}</Text> sudah terdaftar dengan NIK ini.
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Layanan baru akan ditambahkan ke customer ini. Data personal tidak perlu diisi ulang.
                </Text>
              </View>
            )}
          </View>
        </Card>

        {!existingCustomer && (
          <Card className="rounded-xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("customer.stepPersonal")}
            </Text>
            <View className="gap-y-3">
              <FormInput control={control} name="name" label={t("customer.nameLabel")} placeholder={t("customer.namePlaceholder")} />
              <FormInput control={control} name="phone" label={t("customer.phoneLabel")} placeholder={t("customer.phonePlaceholder")} keyboardType="phone-pad" />
              <FormInput control={control} name="email" label={t("customer.emailLabel")} placeholder={t("customer.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
              <FormInput control={control} name="birth_place" label={t("customer.birthPlaceLabel")} placeholder={t("customer.birthPlacePlaceholder")} />
              <FormDatePicker control={control} name="birth_date" label={t("customer.birthDateLabel")} placeholder={t("customer.birthDatePlaceholder")} maximumDate={new Date()} />
              <FormInput control={control} name="address" label={t("customer.addressLabel")} placeholder={t("customer.addressPlaceholder")} isTextarea />
            </View>
          </Card>
        )}
      </>
    );
  }

  if (currentStep === 2) {
    return (
      <Card className="rounded-xl p-4 mb-4">
        <Text weight="bold" className="text-base text-foreground mb-3">
          {t("customer.stepService")}
        </Text>
        <View className="gap-y-3">
          <AsyncSelect
            control={control}
            name="package_id"
            label={t("customer.packageLabel")}
            placeholder={t("customer.packagePlaceholder")}
            fetchOptions={fetchPackageSelectOptions}
            onSelectFullObject={handleSelectPackage}
          />

          {!packageId && (
            <View className="bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 flex-row items-center gap-x-2">
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text className="text-xs text-muted-foreground flex-1">
                {t("customer.noPackageSkipPhotosHint")}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between py-3 border-t border-border/40 min-h-11">
            <Text className="text-sm text-foreground flex-1 mr-4">{t("customer.sameAddress")}</Text>
            <Switch
              value={sameAddress}
              onValueChange={onToggleSameAddress}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={sameAddress ? colors.white : colors.textMuted}
            />
          </View>

          {!sameAddress && (
            <FormInput control={control} name="address_service" label={t("customer.addressServiceLabel")} placeholder={t("customer.addressServicePlaceholder")} isTextarea />
          )}

          <View>
            <Text weight="medium" className="text-sm text-muted-foreground mb-1.5">
              {t("customer.selectOnMap")}
            </Text>
            <TouchableOpacity
              onPress={onOpenMap}
              activeOpacity={0.7}
              className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 min-h-11"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="location-outline" size={20} color={colors.icon} />
                <View className="ml-2 flex-1">
                  {latValue && longValue ? (
                    <View>
                      <Text className="text-foreground text-xs" numberOfLines={2}>
                        {addressServiceValue || t("customer.locationSelected")}
                      </Text>
                      <Text className="text-muted-foreground text-[10px] mt-1">
                        {latValue}, {longValue}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-muted-foreground">{t("customer.selectOnMap")}</Text>
                  )}
                </View>
              </View>
              <View className="bg-primary/10 p-2 rounded-lg">
                <Ionicons name="map" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <FormInput control={control} name="notes" label={t("customer.notesLabel")} placeholder={t("customer.notesPlaceholder")} isTextarea />
        </View>
      </Card>
    );
  }

  if (currentStep === 3) {
    return (
      <Card className="rounded-xl p-4 mb-4">
        <Text weight="bold" className="text-base text-foreground mb-3">
          {t("customer.stepHousePhotos")}
        </Text>
        <PhotoUploadBox label={t("customer.photoFront")} emptyText={t("customer.photoHint")} photo={photoFront} onPress={onPickFront} />
        <PhotoUploadBox label={t("customer.photoSide")} emptyText={t("customer.photoHint")} photo={photoSide} onPress={onPickSide} />
        <PhotoUploadBox label={t("customer.photoFar")} emptyText={t("customer.photoHint")} photo={photoFar} onPress={onPickFar} />
      </Card>
    );
  }

  return (
    <Card className="rounded-xl p-4 mb-4">
      <Text weight="bold" className="text-base text-foreground mb-3">
        {t("customer.stepEvidence")}
      </Text>
      <PhotoUploadBox label={t("customer.photoCustomer")} emptyText={t("customer.photoHint")} photo={photoCustomer} onPress={onPickCustomer} />
      <PhotoUploadBox label={t("customer.photoDevice")} emptyText={t("customer.photoHint")} photo={photoDevice} onPress={onPickDevice} />
    </Card>
  );
}
