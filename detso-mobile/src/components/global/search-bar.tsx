import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "../../lib/utils";
import { useT } from "@/src/features/i18n/store";

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchBar = React.forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      onClear,
      onFocus,
      onBlur,
      className,
      autoFocus = false,
      disabled = false,
    },
    ref
  ) => {
    const { t } = useT();
    const resolvedPlaceholder = placeholder || t("components.searchBar.placeholder");
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      onChangeText("");
      onClear?.();
      Keyboard.dismiss();
    };

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    return (
      <View
        className={cn(
          "flex-row items-center h-12 w-full rounded-xl border bg-background px-3",
          isFocused ? "border-primary" : "border-input",
          disabled && "opacity-50 bg-muted",
          className
        )}
      >
        {/* Search Icon */}
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? "hsl(var(--primary))" : "#94a3b8"}
          className="mr-2"
        />

        {/* Text Input */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={resolvedPlaceholder}
          placeholderTextColor="#94a3b8"
          className="flex-1 h-full text-base text-foreground"
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          editable={!disabled}
          returnKeyType="search"
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            className="ml-2 p-1 bg-muted rounded-full"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

SearchBar.displayName = "SearchBar";
