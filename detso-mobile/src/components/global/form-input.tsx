import React from "react";
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
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  isTextarea = false,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <View className="mb-2">
          {label && <Label>{label}</Label>}

          {isTextarea ? (
            <Textarea
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              {...props}
            />
          ) : (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              isPassword={props.isPassword}
              {...props}
            />
          )}
        </View>
      )}
    />
  );
}
