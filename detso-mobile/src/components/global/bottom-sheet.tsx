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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      snapPoints,
      children,
      onDismiss,
      enableScroll = false,
      enableDrag = true,
    },
    ref,
  ) => {
    // Jika snapPoints tidak diberikan → dynamic sizing (auto-fit content)
    const useDynamic = !snapPoints;
    const insets = useSafeAreaInsets();
    const bottomPadding = insets.bottom + 16;

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
        {...(useDynamic
          ? { enableDynamicSizing: true }
          : { snapPoints }
        )}
        onDismiss={onDismiss}
        enableContentPanningGesture={enableDrag}
        enableHandlePanningGesture={enableDrag}
        enableOverDrag={enableDrag}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundComponent={renderBackground}
        handleIndicatorStyle={{
          backgroundColor: "#94a3b8",
          width: 40,
          height: 5,
        }}
      >
        {enableScroll ? (
          <BottomSheetScrollView 
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            className="flex-1 px-6 pt-2"
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={{ paddingBottom: bottomPadding }} className="px-6 pt-2">
            {children}
          </BottomSheetView>
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
