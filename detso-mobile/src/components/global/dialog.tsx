import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ViewProps,
  TextProps,
} from "react-native";
import { cn } from "../../lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 justify-center items-center px-6 bg-black/50">
        <Pressable
          className="absolute inset-0"
          onPress={() => onOpenChange(false)}
        />

        {children}
      </View>
    </Modal>
  );
};

const DialogContent = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "w-full max-w-md rounded-3xl bg-card p-6 shadow-lg z-10",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  ),
);
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("mb-4 flex flex-col gap-1.5", className)}
      {...props}
    />
  ),
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-xl font-semibold leading-none tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  ),
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("mt-6 flex-row justify-end gap-3", className)}
      {...props}
    />
  ),
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
