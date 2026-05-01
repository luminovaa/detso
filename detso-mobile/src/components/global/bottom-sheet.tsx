import React, { forwardRef, useCallback } from "react";
import { View, ViewProps } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { cn } from "../../lib/utils";
import { CustomTextProps, Text } from "./text";

export interface BottomSheetProps {
  snapPoints?: string[];
  children: React.ReactNode;
  onDismiss?: () => void;
  enableScroll?: boolean;
  enableDrag?: boolean;
}

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    {
      snapPoints = ["50%"],
      children,
      onDismiss,
      enableScroll = false,
      enableDrag = true,
    },
    ref,
  ) => {
    // 1. Backdrop (Latar Belakang Gelap)
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.6}
        />
      ),
      [],
    );

    // 2. Custom Background (Supaya NativeWind 'bg-card' bisa terbaca!)
    const renderBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => (
        <View
          style={style}
          className="bg-card rounded-t-[32px] overflow-hidden"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        enableContentPanningGesture={enableDrag}
        enableHandlePanningGesture={enableDrag}
        enableOverDrag={enableDrag}
        backdropComponent={renderBackdrop}
        // Ganti properti backgroundStyle dengan backgroundComponent
        backgroundComponent={renderBackground}
        // Handle pill (garis abu-abu di atas laci)
        handleIndicatorStyle={{
          backgroundColor: "#94a3b8",
          width: 40,
          height: 5,
        }}
      >
        {enableScroll ? (
          <BottomSheetScrollView className="flex-1 px-6 pb-6 pt-2">
            {children}
          </BottomSheetScrollView>
        ) : (
          <View className="flex-1 px-6 pb-6 pt-2">{children}</View>
        )}
      </BottomSheetModal>
    );
  },
);
BottomSheet.displayName = "BottomSheet";

// --- HEADER KOMPONEN ---
export const BottomSheetHeader = ({
  className,
  children,
  ...props
}: ViewProps) => (
  <View className={cn("mb-5 mt-2 flex flex-col gap-1.5", className)} {...props}>
    {children}
  </View>
);

export const BottomSheetTitle = ({
  className,
  children,
  ...props
}: CustomTextProps) => (
  <Text
    weight="bold"
    className={cn("text-xl text-foreground text-center", className)}
    {...props}
  >
    {children}
  </Text>
);

export const BottomSheetDescription = ({
  className,
  children,
  ...props
}: CustomTextProps) => (
  <Text
    className={cn("text-sm text-muted-foreground text-center", className)}
    {...props}
  >
    {children}
  </Text>
);

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
