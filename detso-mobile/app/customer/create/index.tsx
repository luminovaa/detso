import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Button } from "@/src/components/global/button";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { MapLocationPicker } from "@/src/components/global/map-picker";
import { StepIndicator } from "@/src/components/screens/customer/step-indicator";
import { CustomerCreateSteps } from "@/src/components/screens/customer/customer-create-steps";

import { useT } from "@/src/features/i18n/store";
import { createCustomerSchema, CreateCustomerInput } from "@/src/features/customer/schema";
import { useCreateCustomer } from "@/src/features/customer/hooks";
import { customerService } from "@/src/features/customer/service";
import {
  CustomerPhotoState,
  buildCreateCustomerFormData,
} from "@/src/features/customer/form-helpers";

const TOTAL_STEPS = 4;

export default function CustomerCreateScreen() {
  const { t } = useT();
  const createCustomer = useCreateCustomer();
  const isSubmitting = createCustomer.isPending;

  const [currentStep, setCurrentStep] = useState(1);
  const [sameAddress, setSameAddress] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [existingCustomer, setExistingCustomer] = useState<{ id: string; name: string } | null>(null);
  const [nikChecking, setNikChecking] = useState(false);
  const nikCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ktpPhoto, setKtpPhoto] = useState<CustomerPhotoState | null>(null);
  const [showKtpPicker, setShowKtpPicker] = useState(false);
  const [photoFront, setPhotoFront] = useState<CustomerPhotoState | null>(null);
  const [showFrontPicker, setShowFrontPicker] = useState(false);
  const [photoSide, setPhotoSide] = useState<CustomerPhotoState | null>(null);
  const [showSidePicker, setShowSidePicker] = useState(false);
  const [photoFar, setPhotoFar] = useState<CustomerPhotoState | null>(null);
  const [showFarPicker, setShowFarPicker] = useState(false);
  const [photoCustomer, setPhotoCustomer] = useState<CustomerPhotoState | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [photoDevice, setPhotoDevice] = useState<CustomerPhotoState | null>(null);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const stepLabels = [
    t("customer.stepPersonal"),
    t("customer.stepService"),
    t("customer.stepHousePhotos"),
    t("customer.stepEvidence"),
  ];

  const { control, handleSubmit, setValue, watch, trigger } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
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
  const nikValue = watch("nik");
  const packageIdValue = watch("package_id");
  const latValue = watch("lat");
  const longValue = watch("long");

  const hasPackage = Boolean(packageIdValue);
  // Skip installation photo steps when saving a legacy customer without selecting a package
  const canFinishAtStep2 = currentStep === 2 && !hasPackage && !existingCustomer;
  const isSubmitStep = currentStep === TOTAL_STEPS || canFinishAtStep2;

  useEffect(() => {
    if (sameAddress && addressValue) {
      setValue("address_service", addressValue);
    }
  }, [sameAddress, addressValue, setValue]);

  useEffect(() => {
    if (nikCheckTimerRef.current) {
      clearTimeout(nikCheckTimerRef.current);
    }

    if (!nikValue || nikValue.length < 16) {
      setExistingCustomer(null);
      return;
    }

    if (nikValue.length === 16 && /^\d{16}$/.test(nikValue)) {
      setNikChecking(true);
      nikCheckTimerRef.current = setTimeout(async () => {
        try {
          const res = await customerService.checkNik(nikValue);
          const data = res?.data;
          if (data?.exists && data?.customer) {
            setExistingCustomer({ id: data.customer.id, name: data.customer.name });
          } else {
            setExistingCustomer(null);
          }
        } catch {
          setExistingCustomer(null);
        } finally {
          setNikChecking(false);
        }
      }, 500);
    }

    return () => {
      if (nikCheckTimerRef.current) clearTimeout(nikCheckTimerRef.current);
    };
  }, [nikValue]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateCustomerInput)[] = [];
    if (currentStep === 1 && !existingCustomer) {
      fieldsToValidate = ["name"];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
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
    const formData = buildCreateCustomerFormData(data, {
      ktpPhoto,
      photoFront,
      photoSide,
      photoFar,
      photoCustomer,
      photoDevice,
    });

    createCustomer.mutate(formData, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("customer.createTitle")} showBackButton>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          labels={stepLabels}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CustomerCreateSteps
            currentStep={currentStep}
            control={control}
            setValue={setValue}
            watch={watch}
            sameAddress={sameAddress}
            onToggleSameAddress={setSameAddress}
            onOpenMap={() => setShowMap(true)}
            nikChecking={nikChecking}
            existingCustomer={existingCustomer}
            ktpPhoto={ktpPhoto}
            photoFront={photoFront}
            photoSide={photoSide}
            photoFar={photoFar}
            photoCustomer={photoCustomer}
            photoDevice={photoDevice}
            onPickKtp={() => setShowKtpPicker(true)}
            onPickFront={() => setShowFrontPicker(true)}
            onPickSide={() => setShowSidePicker(true)}
            onPickFar={() => setShowFarPicker(true)}
            onPickCustomer={() => setShowCustomerPicker(true)}
            onPickDevice={() => setShowDevicePicker(true)}
          />
        </ScrollView>

        <View className="pt-3 pb-2 border-t border-border/10 bg-background">
          <View className="flex-row gap-x-3">
            <Button
              title={currentStep === 1 ? t("customer.cancelBtn") : t("customer.back")}
              size="lg"
              variant="outline"
              className="flex-1"
              onPress={handleBack}
            />
            {!isSubmitStep ? (
              <Button
                title={t("customer.next")}
                size="lg"
                className="flex-1 shadow-lg shadow-primary/20"
                onPress={handleNext}
              />
            ) : (
              <Button
                title={isSubmitting ? t("customer.creating") : canFinishAtStep2 ? t("common.save") : t("customer.submit")}
                size="lg"
                className="flex-1 shadow-lg shadow-primary/20"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

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
          latValue && longValue
            ? { latitude: parseFloat(latValue), longitude: parseFloat(longValue) }
            : null
        }
        initialAddress={watch("address_service")}
      />
    </ScreenWrapper>
  );
}
