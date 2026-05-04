import React from "react";
import { View, TextInputProps } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { BottomSheetInput } from "./bottom-sheet-input";
import { Label } from "./label";

export interface FormBottomSheetInputProps<T extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "style"
> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  isPassword?: boolean;
  isCurrency?: boolean;
  prefix?: string;
  suffixComponent?: React.ReactNode;
}

/**
 * Format angka ke format ribuan Indonesia (titik sebagai separator)
 */
function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const numStr = String(value).replace(/\D/g, "");
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parse formatted currency string ke angka
 */
function parseCurrency(formatted: string): number | undefined {
  const cleaned = formatted.replace(/\./g, "");
  if (!cleaned) return undefined;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * FormInput variant optimized for @gorhom/bottom-sheet
 * Uses BottomSheetTextInput internally for proper keyboard handling
 */
export function FormBottomSheetInput<T extends FieldValues>({
  control,
  name,
  label,
  isCurrency = false,
  prefix,
  suffixComponent,
  ...props
}: FormBottomSheetInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        const displayValue = isCurrency ? formatCurrency(value) : value;

        const handleChange = isCurrency
          ? (text: string) => onChange(parseCurrency(text))
          : onChange;

        return (
          <View className="mb-2">
            {label && <Label>{label}</Label>}
            <BottomSheetInput
              value={displayValue}
              onChangeText={handleChange}
              onBlur={onBlur}
              error={error?.message}
              isPassword={props.isPassword}
              prefix={isCurrency ? (prefix || "Rp") : prefix}
              suffixComponent={suffixComponent}
              {...props}
            />
          </View>
        );
      }}
    />
  );
}
