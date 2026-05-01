import React, { useState } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { formatDate, formatTime, formatDateTime } from "@/src/lib/format-date";
import { cn } from "@/src/lib/utils";
import { Text } from "@/src/components/global/text";
import { Label } from "@/src/components/global/label";
import { useT } from "@/src/features/i18n/store";

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  mode?: "date" | "time" | "datetime";
  minimumDate?: Date; // Opsional: Batas tanggal paling lama
  maximumDate?: Date; // Opsional: Batas tanggal paling baru
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  placeholder,
  mode = "date",
  minimumDate,
  maximumDate,
}: FormDatePickerProps<T>) {
  const { t } = useT();
  const resolvedPlaceholder = placeholder || t("components.datePicker.placeholder");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? t("components.datePicker.required", { label }) : false }}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // Fungsi saat user memencet tombol "OK" / "Confirm" di kalender
        const handleConfirm = (date: Date) => {
          onChange(date); // Simpan objek Date ke React Hook Form
          hideDatePicker();
        };

        return (
          <View className="mb-4">
            <Label>
              {label} {required && <Text className="text-destructive">*</Text>}
            </Label>

            {hint && (
              <Text className="text-muted-foreground text-xs mb-2 ml-1">
                {hint}
              </Text>
            )}

            {/* TRIGGER BUTTON (Tampilannya mirip form input biasa) */}
            <TouchableOpacity
              onPress={showDatePicker}
              activeOpacity={0.85}
              className={cn(
                "flex-row items-center bg-background h-14 px-4 rounded-2xl border transition-colors mt-2 shadow-sm",
                error ? "border-destructive bg-destructive/5" : "border-input",
              )}
            >
              <Ionicons
                name={mode === "time" ? "time-outline" : "calendar-outline"}
                size={20}
                color={error ? "#ef4444" : "#94a3b8"}
                className="mr-3"
              />
              <Text
                className={cn(
                  "flex-1 text-base",
                  !value ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {/* Jika ada value (Date), format tanggalnya. Jika kosong, tampilkan placeholder */}
                {value
                  ? mode === "time"
                    ? formatTime(new Date(value))
                    : mode === "datetime"
                      ? formatDateTime(new Date(value))
                      : formatDate(new Date(value))
                  : resolvedPlaceholder}{" "}
              </Text>
            </TouchableOpacity>

            {error && (
              <Text className="text-destructive text-xs ml-1 mt-1 font-medium">
                {error.message}
              </Text>
            )}

            {/* MODAL KALENDER BAWAAN OS */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode={mode}
              date={value ? new Date(value) : new Date()} // Default ke hari ini jika kosong
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              // Konfigurasi khusus iOS agar tombolnya berbahasa Indonesia/Custom
              confirmTextIOS={t("components.datePicker.confirm")}
              cancelTextIOS={t("components.datePicker.cancel")}
              // Biarkan OS menentukan tema (Dark/Light) agar tidak bentrok
              themeVariant={Platform.OS === "ios" ? undefined : "light"}
              is24Hour={true}
              locale="id-ID"
            />
          </View>
        );
      }}
    />
  );
}
