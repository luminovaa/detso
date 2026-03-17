import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "../../lib/utils";

const Label = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground mb-2 ml-1",
        className,
      )}
      {...props}
    />
  ),
);

Label.displayName = "Label";

export { Label };
