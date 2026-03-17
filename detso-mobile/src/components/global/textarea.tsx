import React, { useState } from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { cn } from "../../lib/utils";

export interface TextareaProps extends TextInputProps {
  error?: string;
}

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View className="mb-4">
        <TextInput
          ref={ref}
          multiline={true}
          textAlignVertical="top"
          placeholderTextColor="#94a3b8"
          className={cn(
            "min-h-[120px] w-full rounded-2xl border bg-background px-4 py-4 text-base text-foreground leading-tight",

            error
              ? "border-destructive"
              : isFocused
                ? "border-primary"
                : "border-input",

            props.editable === false ? "opacity-50 bg-muted" : "",
            className,
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {error ? (
          <Text className="text-xs text-destructive mt-1 ml-1 font-medium">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
