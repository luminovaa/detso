import React, { useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Image } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Label } from "@/src/components/global/label";
import { FormDatePicker } from "@/src/components/global/date-picker";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { MapLocationPicker } from "@/src/components/global/map-picker";
import { AsyncSelect } from "@/src/components/global/select-searchable";

// --- Feature Components ---
import { StepIndicator } from "@/src/components/screens/customer/step-indicator";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { createCustomerSchema, CreateCustomerInput } from "@/src/features/customer/schema";
import { useCreateCustomer } from "@/src/features/customer/hooks";
import { packageService } from "@/src/features/package/service";

const TOTAL_STEPS = 5;

interface PhotoState {
  uri: string;
  base64?: string;
}

export default function CustomerCreateScreen() {
  const { t } = useT();
  const createCustomer = useCreateCustomer();
  const isSubmitting = createCustomer.isPending;

  const [currentStep, setCurrentStep] = useState(1);
  const [sameAddress, setSameAddress] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Photo states
  const [ktpPhoto, setKtpPhoto] = useState<PhotoState | null>(null);
  const [showKtpPicker, setShowKtpPicker] = useState(false);
  const [photoFront, setPhotoFront] = useState<PhotoState | null>(null);
  const [showFrontPicker, setShowFrontPicker] = useState(false);
  const [photoSide, setPhotoSide] = useState<PhotoState | null>(null);
  const [showSidePicker, setShowSidePicker] = useState(false);
  const [photoFar, setPhotoFar] = useState<PhotoState | null>(null);
  const [showFarPicker, setShowFarPicker] = useState(false);
  const [photoCustomer, setPhotoCustomer] = useState<PhotoState | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [photoDevice, setPhotoDevice] = useState<PhotoState | null>(null);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const stepLabels = [
    t("customer.stepPersonal"),
    t("customer.stepService"),
    t("customer.stepTechnical"),
    t("customer.stepHousePhotos"),
    t("customer.stepEvidence"),
  ];

  const { control, handleSubmit, setValue, watch, trigger } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      nik: "",
      address: "",
      address_service: "",
      package_id: "",
      lat: "",
      long: "",
      ip_address: "",
      mac_address: "",
      notes: "",
      birth_place: "",
    },
  });

  const addressValue = watch("address");

  // Sync address if checkbox is checked
  React.useEffect(() => {
    if (sameAddress && addressValue) {
      setValue("address_service", addressValue);
    }
  }, [sameAddress, addressValue, setValue]);

  const fetchPackages = useCallback(
    async (search: string, page: number) => {
      const res = await packageService.getAll({ search, page, limit: 20 });
      const packages = res?.data?.packages || [];
      return {
        data: packages.map((pkg: any) => ({
          label: `${pkg.name} - ${pkg.speed}`,
          value: pkg.id,
          price: pkg.price,
          speed: pkg.speed,
          name: pkg.name,
        })),
        hasNextPage: res?.data?.pagination?.hasNextPage || false,
      };
    },
    [],
  );

  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof CreateCustomerInput)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["name", "address"];
        break;
      case 2:
        fieldsToValidate = ["package_id", "address_service"];
        break;
      case 3:
        // Technical fields are optional
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    // Step 1: KTP photo required
    if (currentStep === 1 && !ktpPhoto) {
      return; // Don't proceed without KTP
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = (data: CreateCustomerInput) => {
    const formData = new FormData();

    // Customer fields
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.nik) formData.append("nik", data.nik);
    formData.append("address", data.address);
    if (data.birth_place) formData.append("birth_place", data.birth_place);
    if (data.birth_date) formData.append("birth_date", new Date(data.birth_date).toISOString());

    // Service connection fields
    formData.append("package_id", data.package_id);
    formData.append("address_service", data.address_service);
    if (data.lat) formData.append("lat", data.lat);
    if (data.long) formData.append("long", data.long);
    if (data.ip_address) formData.append("ip_address", data.ip_address);
    if (data.mac_address) formData.append("mac_address", data.mac_address);
    if (data.notes) formData.append("notes", data.notes);

    // Documents (KTP)
    if (ktpPhoto) {
      formData.append("documents", JSON.stringify([{ type: "ktp" }]));
      const ext = ktpPhoto.uri.split(".").pop() || "jpg";
      formData.append("documents", {
        uri: ktpPhoto.uri,
        name: `ktp-${Date.now()}.${ext}`,
        type: `image/${ext === "jpg" ? "jpeg" : ext}`,
      } as any);
    }

    // Photos
    const photoTypes: { type: string; photo: PhotoState | null }[] = [
      { type: "rumah_depan", photo: photoFront },
      { type: "rumah_samping", photo: photoSide },
      { type: "rumah_jauh", photo: photoFar },
      { type: "denganpelanggan", photo: photoCustomer },
      { type: "alat", photo: photoDevice },
    ];

    const validPhotos = photoTypes.filter((p) => p.photo !== null);
    if (validPhotos.length > 0) {
      formData.append("photos", JSON.stringify(validPhotos.map((p) => ({ type: p.type }))));
      validPhotos.forEach((p) => {
        const ext = p.photo!.uri.split(".").pop() || "jpg";
        formData.append("photos", {
          uri: p.photo!.uri,
          name: `${p.type}-${Date.now()}.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as any);
      });
    }

    createCustomer.mutate(formData as any, {
      onSuccess: () => router.back(),
    });
  };

  const renderPhotoUpload = (
    label: string,
    photo: PhotoState | null,
    onPress: () => void,
    required = true,
  ) => (
    <View className="mb-4">
      <Label>{label} {required && <Text className="text-destructive">*</Text>}</Label>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="mt-2 border-2 border-dashed border-border rounded-2xl h-40 items-center justify-center overflow-hidden bg-muted/20"
      >
        {photo ? (
          <Image source={{ uri: photo.uri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center">
            <Ionicons name="camera-outline" size={32} color="#94a3b8" />
            <Text className="text-muted-foreground text-xs mt-2">{t("customer.photoHint")}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper headerTitle={t("customer.createTitle")} showBackButton>
      <View className="flex-1">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          labels={stepLabels}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ STEP 1: Personal Data ═══ */}
          {currentStep === 1 && (
            <View className="gap-y-3">
              {/* KTP Upload */}
              <View className="mb-2">
                <Label>{t("customer.ktpLabel")} <Text className="text-destructive">*</Text></Label>
                <Text className="text-muted-foreground text-xs mb-2">{t("customer.ktpHint")}</Text>
                <TouchableOpacity
                  onPress={() => setShowKtpPicker(true)}
                  activeOpacity={0.7}
                  className="border-2 border-dashed border-border rounded-2xl h-36 items-center justify-center overflow-hidden bg-muted/20"
                >
                  {ktpPhoto ? (
                    <Image source={{ uri: ktpPhoto.uri }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center">
                      <Ionicons name="id-card-outline" size={32} color="#94a3b8" />
                      <Text className="text-muted-foreground text-xs mt-2">{t("customer.photoHint")}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {!ktpPhoto && (
                  <Text className="text-destructive text-xs mt-1">{t("customer.photoRequired")}</Text>
                )}
              </View>

              <FormInput control={control} name="name" label={t("customer.nameLabel")} placeholder={t("customer.namePlaceholder")} />
              <FormInput control={control} name="nik" label={t("customer.nikLabel")} placeholder={t("customer.nikPlaceholder")} keyboardType="numeric" />
              <FormInput control={control} name="phone" label={t("customer.phoneLabel")} placeholder={t("customer.phonePlaceholder")} keyboardType="phone-pad" />
              <FormInput control={control} name="email" label={t("customer.emailLabel")} placeholder={t("customer.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
              <FormInput control={control} name="birth_place" label={t("customer.birthPlaceLabel")} placeholder={t("customer.birthPlacePlaceholder")} />
              <FormDatePicker control={control} name="birth_date" label={t("customer.birthDateLabel")} placeholder={t("customer.birthDatePlaceholder")} maximumDate={new Date()} />
              <FormInput control={control} name="address" label={t("customer.addressLabel")} placeholder={t("customer.addressPlaceholder")} isTextarea />
            </View>
          )}

          {/* ═══ STEP 2: Service Data ═══ */}
          {currentStep === 2 && (
            <View className="gap-y-3">
              <AsyncSelect
                control={control}
                name="package_id"
                label={t("customer.packageLabel")}
                placeholder={t("customer.packagePlaceholder")}
                fetchOptions={fetchPackages}
                required
                onSelectFullObject={(item) => {
                  setValue("package_name" as any, item.name);
                  setValue("package_speed" as any, item.speed);
                  setValue("package_price" as any, item.price);
                }}
              />

              {/* Same address checkbox */}
              <View className="flex-row items-center justify-between py-3 border-t border-border/40">
                <Text className="text-sm text-foreground flex-1 mr-4">{t("customer.sameAddress")}</Text>
                <Switch
                  value={sameAddress}
                  onValueChange={setSameAddress}
                  trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                  thumbColor={sameAddress ? "#3b82f6" : "#94a3b8"}
                />
              </View>

              {!sameAddress && (
                <FormInput control={control} name="address_service" label={t("customer.addressServiceLabel")} placeholder={t("customer.addressServicePlaceholder")} isTextarea />
              )}

              {/* Map Picker */}
              <View>
                <Label>{t("customer.selectOnMap")}</Label>
                <TouchableOpacity
                  onPress={() => setShowMap(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="location-outline" size={20} color="#64748b" />
                    <View className="ml-2 flex-1">
                      {watch("lat") && watch("long") ? (
                        <View>
                          <Text className="text-foreground text-xs" numberOfLines={2}>
                            {watch("address_service") || "Lokasi dipilih"}
                          </Text>
                          <Text className="text-muted-foreground text-[10px] mt-1">
                            {watch("lat")}, {watch("long")}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-muted-foreground">{t("customer.selectOnMap")}</Text>
                      )}
                    </View>
                  </View>
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <Ionicons name="map" size={20} color="#1E40AF" />
                  </View>
                </TouchableOpacity>
              </View>

              <FormInput control={control} name="notes" label={t("customer.notesLabel")} placeholder={t("customer.notesPlaceholder")} isTextarea />
            </View>
          )}

          {/* ═══ STEP 3: Technical Data ═══ */}
          {currentStep === 3 && (
            <View className="gap-y-3">
              <FormInput control={control} name="ip_address" label={t("customer.ipLabel")} placeholder={t("customer.ipPlaceholder")} keyboardType="numeric" />
              <FormInput control={control} name="mac_address" label={t("customer.macLabel")} placeholder={t("customer.macPlaceholder")} autoCapitalize="characters" />
            </View>
          )}

          {/* ═══ STEP 4: House Photos ═══ */}
          {currentStep === 4 && (
            <View>
              {renderPhotoUpload(t("customer.photoFront"), photoFront, () => setShowFrontPicker(true))}
              {renderPhotoUpload(t("customer.photoSide"), photoSide, () => setShowSidePicker(true))}
              {renderPhotoUpload(t("customer.photoFar"), photoFar, () => setShowFarPicker(true))}
            </View>
          )}

          {/* ═══ STEP 5: Evidence Photos ═══ */}
          {currentStep === 5 && (
            <View>
              {renderPhotoUpload(t("customer.photoCustomer"), photoCustomer, () => setShowCustomerPicker(true))}
              {renderPhotoUpload(t("customer.photoDevice"), photoDevice, () => setShowDevicePicker(true))}
            </View>
          )}
        </ScrollView>

        {/* Fixed Bottom Buttons */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <View className="flex-row gap-x-3">
            <Button
              title={currentStep === 1 ? t("customer.cancelBtn") : t("customer.back")}
              size="lg"
              variant="outline"
              className="flex-1"
              onPress={handleBack}
            />
            {currentStep < TOTAL_STEPS ? (
              <Button
                title={t("customer.next")}
                size="lg"
                className="flex-1 shadow-lg shadow-primary/20"
                onPress={handleNext}
              />
            ) : (
              <Button
                title={isSubmitting ? t("customer.creating") : t("customer.submit")}
                size="lg"
                className="flex-1 shadow-lg shadow-primary/20"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              />
            )}
          </View>
        </View>
      </View>

      {/* ═══ MODALS ═══ */}
      <ImagePickerSheet visible={showKtpPicker} onClose={() => setShowKtpPicker(false)} onImageSelected={(uri, base64) => setKtpPhoto({ uri, base64 })} />
      <ImagePickerSheet visible={showFrontPicker} onClose={() => setShowFrontPicker(false)} onImageSelected={(uri, base64) => setPhotoFront({ uri, base64 })} />
      <ImagePickerSheet visible={showSidePicker} onClose={() => setShowSidePicker(false)} onImageSelected={(uri, base64) => setPhotoSide({ uri, base64 })} />
      <ImagePickerSheet visible={showFarPicker} onClose={() => setShowFarPicker(false)} onImageSelected={(uri, base64) => setPhotoFar({ uri, base64 })} />
      <ImagePickerSheet visible={showCustomerPicker} onClose={() => setShowCustomerPicker(false)} onImageSelected={(uri, base64) => setPhotoCustomer({ uri, base64 })} />
      <ImagePickerSheet visible={showDevicePicker} onClose={() => setShowDevicePicker(false)} onImageSelected={(uri, base64) => setPhotoDevice({ uri, base64 })} />

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelected={(lat, lng, addressText) => {
          setValue("lat", lat.toString());
          setValue("long", lng.toString());
          if (addressText && !sameAddress) {
            setValue("address_service", addressText);
          }
        }}
        initialCoordinate={
          watch("lat") && watch("long")
            ? { latitude: parseFloat(watch("lat")!), longitude: parseFloat(watch("long")!) }
            : null
        }
        initialAddress={watch("address_service")}
      />
    </ScreenWrapper>
  );
}
