import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";
import { cn } from "../../lib/utils";
import { Text } from "./text";

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          "flex-row items-center justify-center rounded-full active:opacity-80 transition-opacity",

          // Size styles
          {
            "py-2 px-4": size === "sm",
            "py-4 px-6": size === "md",
            "py-5 px-8": size === "lg",
          },

          // Variant styles
          {
            "bg-primary": variant === "primary",
            "bg-secondary": variant === "secondary",
            "bg-destructive": variant === "destructive",
            "bg-transparent border border-input active:bg-muted":
              variant === "outline",
            "bg-transparent active:bg-muted": variant === "ghost",
          },

          // State styles
          disabled || isLoading ? "opacity-50" : "",

          // Custom classes (jika ada bentrok, className ini yang menang!)
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost" ? "gray" : "white"
            }
            className="mr-2"
          />
        ) : leftIcon ? (
          <View className="mr-2">{leftIcon}</View>
        ) : null}

        {children ? (
          children
        ) : (
          <Text
            className={cn(
              "text-center",
              // Text sizes
              {
                "text-sm": size === "sm",
                "text-base font-semibold": size === "md",
                "text-lg font-bold": size === "lg",
              },
              // Text colors
              {
                "text-primary-foreground": variant === "primary",
                "text-secondary-foreground": variant === "secondary",
                "text-destructive-foreground": variant === "destructive",
                "text-foreground": variant === "outline" || variant === "ghost",
              },
            )}
          >
            {title}
          </Text>
        )}

        {!isLoading && rightIcon && <View className="ml-2">{rightIcon}</View>}
      </TouchableOpacity>
    );
  },
);

Button.displayName = "Button";
