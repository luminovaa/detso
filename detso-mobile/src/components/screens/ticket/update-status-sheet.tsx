import React, { forwardRef, useState, useCallback } from "react";
import { View, TouchableOpacity, TextInput, Image } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { useT } from "@/src/features/i18n/store";
import { useUpdateTicketStatus } from "@/src/features/ticket/hooks";
import { TicketStatus } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";

import { COLORS } from '@/src/lib/colors';
interface UpdateStatusSheetProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

const STATUS_OPTIONS: { value: TicketStatus; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: "OPEN", labelKey: "ticket.statusOpen", variant: "info" },
  { value: "IN_PROGRESS", labelKey: "ticket.statusInProgress", variant: "warning" },
  { value: "RESOLVED", labelKey: "ticket.statusResolved", variant: "success" },
  { value: "CLOSED", labelKey: "ticket.statusClosed", variant: "neutral" },
];

function UpdateStatusSheetInner(
  { ticketId, currentStatus }: UpdateStatusSheetProps,
  ref: React.ForwardedRef<BottomSheetModal>,
) {
    const { t } = useT();
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(currentStatus);
    const [note, setNote] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const updateStatus = useUpdateTicketStatus();

    const isResolvingOrClosing = selectedStatus === "RESOLVED" || selectedStatus === "CLOSED";
    const photoRequired = selectedStatus === "RESOLVED";
    const canSubmit = selectedStatus !== currentStatus && (!photoRequired || photo);

    const handlePickPhoto = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    };

    const handleTakePhoto = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    };

    const handleSubmit = () => {
      const formData = new FormData();
      formData.append("status", selectedStatus);
      if (note.trim()) {
        formData.append("description", note.trim());
      }
      if (photo) {
        const filename = photo.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("image", {
          uri: photo,
          name: filename,
          type,
        } as any);
      }

      updateStatus.mutate(
        { id: ticketId, formData },
        {
          onSuccess: () => {
            setNote("");
            setPhoto(null);
            (ref as any)?.current?.close();
          },
        },
      );
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["65%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: COLORS.neutral.white }}
        handleIndicatorStyle={{ backgroundColor: COLORS.neutral.gray[500] }}
      >
        <BottomSheetView className="flex-1 px-6 pt-2 pb-6">
          {/* Title */}
          <Text weight="bold" className="text-lg text-foreground mb-4">
            {t("ticket.selectNewStatus")}
          </Text>

          {/* Status Options */}
          <View className="gap-y-2 mb-4">
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.7}
                onPress={() => setSelectedStatus(option.value)}
                className={`flex-row items-center p-3 rounded-xl border ${
                  selectedStatus === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                  selectedStatus === option.value ? "border-primary" : "border-muted-foreground"
                }`}>
                  {selectedStatus === option.value && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
                <Badge colorVariant={option.variant}>
                  {t(option.labelKey)}
                </Badge>
                {option.value === currentStatus && (
                  <Text className="text-xs text-muted-foreground ml-2">(current)</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <TextInput
            placeholder={t("ticket.noteOptional")}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            className="border border-border rounded-xl p-3 text-sm text-foreground mb-3"
            placeholderTextColor={COLORS.neutral.gray[500]}
            style={{ textAlignVertical: "top", minHeight: 60 }}
          />

          {/* Photo Section */}
          {isResolvingOrClosing && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">
                {photoRequired ? t("ticket.photoRequired") : t("ticket.photoOptional")}
              </Text>

              {photo ? (
                <View className="relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-32 rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setPhoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 items-center justify-center"
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    className="flex-1 h-20 rounded-xl border border-dashed border-border items-center justify-center"
                  >
                    <Ionicons name="camera-outline" size={24} color={COLORS.neutral.gray[500]} />
                    <Text className="text-xs text-muted-foreground mt-1">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    className="flex-1 h-20 rounded-xl border border-dashed border-border items-center justify-center"
                  >
                    <Ionicons name="image-outline" size={24} color={COLORS.neutral.gray[500]} />
                    <Text className="text-xs text-muted-foreground mt-1">Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={!canSubmit || updateStatus.isPending}
            className={`h-12 rounded-xl items-center justify-center ${
              canSubmit && !updateStatus.isPending ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              weight="semibold"
              className={`text-base ${canSubmit && !updateStatus.isPending ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {updateStatus.isPending ? t("ticket.updating") : t("ticket.confirmStatusUpdate")}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    );
}

export const UpdateStatusSheet = forwardRef<BottomSheetModal, UpdateStatusSheetProps>(UpdateStatusSheetInner);
UpdateStatusSheet.displayName = "UpdateStatusSheet";
