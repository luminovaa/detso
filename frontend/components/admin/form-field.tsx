"use client";

import {
  FormControl,
  FormDescription,
  FormField as FormFieldPrimitive,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { ReactNode } from "react";
import { formatCurrency, parseCurrency } from "@/utils/format-currency";
import { DatePicker } from "../ui/date-picker";

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "date"
    | "currency";
  selectOptions?: { value: string; label: string }[];
  children?: ReactNode;
};

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  placeholder,
  description,
  disabled = false,
  className = "",
  type = "text",
  selectOptions = [],
  children,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <FormFieldPrimitive
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {type === "date" ? (
              <DatePicker
                value={field.value ?? ""}
                onChange={(date) => field.onChange(date)}
              />
            ) : type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                disabled={disabled}
                className="rounded-3xl"
                {...field}
              />
            ) : type === "select" ? (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="rounded-3xl">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-3xl">
                  {selectOptions.map((option) => (
                    <SelectItem
                      className="rounded-3xl"
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === "currency" ? (
              <Input
                className="rounded-3xl"
                placeholder={placeholder}
                disabled={disabled}
                type="text"
                value={field.value ? formatCurrency(field.value) : ""}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  // Simpan nilai numerik asli ke form state
                  const parsedValue = parseCurrency(rawValue);
                  field.onChange(parsedValue);
                }}
                onBlur={() => {
                  // Format ulang saat kehilangan fokus
                  if (field.value !== undefined && field.value !== null) {
                    field.onChange(Number(field.value));
                  }
                }}
                inputMode="numeric"
              />
            ) : children ? (
              children
            ) : (
              <Input
                className="rounded-3xl"
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                {...field}
              />
            )}
          </FormControl>
          {description && (
            <FormDescription className="text-xs ml">
              * {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
