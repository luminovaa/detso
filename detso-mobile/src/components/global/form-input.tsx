import React, { useCallback } from "react";
import { View, TextInputProps } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";

export interface FormInputProps<T extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText"
> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  isTextarea?: boolean;
  isPassword?: boolean;
  isCurrency?: boolean;
  prefix?: string;
  suffixComponent?: React.ReactNode;
}

/**
 * Format angka ke format ribuan Indonesia (titik sebagai separator)
 * Contoh: 150000 → "150.000"
 */
function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const numStr = String(value).replace(/\D/g, "");
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parse formatted currency string ke angka
 * Contoh: "150.000" → 150000
 */
function parseCurrency(formatted: string): number | undefined {
  const cleaned = formatted.replace(/\./g, "");
  if (!cleaned) return undefined;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  isTextarea = false,
  isCurrency = false,
  prefix,
  suffixComponent,
  ...props
}: FormInputProps<T>) {
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

            {isTextarea ? (
              <Textarea
                value={displayValue}
                onChangeText={handleChange}
                onBlur={onBlur}
                error={error?.message}
                {...props}
              />
            ) : (
              <Input
                value={displayValue}
                onChangeText={handleChange}
                onBlur={onBlur}
                error={error?.message}
                isPassword={props.isPassword}
                prefix={isCurrency ? (prefix || "Rp") : prefix}
                suffixComponent={suffixComponent}
                {...props}
              />
            )}
          </View>
        );
      }}
    />
  );
}
