import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { cn } from "../../lib/utils";

export interface CustomTextProps extends RNTextProps {
  weight?: "regular" | "medium" | "semibold" | "bold" | "heavy";
}

const CustomText = React.forwardRef<RNText, CustomTextProps>(
  ({ className, weight = "regular", ...props }, ref) => {
    const fontClass = {
      regular: "font-sf-regular",
      medium: "font-sf-medium",
      semibold: "font-sf-semibold",
      bold: "font-sf-bold",
      heavy: "font-sf-heavy",
    }[weight];

    return (
      <RNText
        ref={ref}
        className={cn(fontClass, "text-foreground", className)}
        {...props}
      />
    );
  },
);

CustomText.displayName = "Text";

export { CustomText as Text };
