import React, { useRef } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { ServiceConnection } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";

interface ServiceItemProps {
  item: ServiceConnection;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function ServiceItem({ item, searchQuery = "", onDelete, isDeleting }: ServiceItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const customerName = item.customer?.name || "-";

  const getStatusColor = (status: string): BadgeVariantKey => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "neutral";
      case "SUSPENDED":
        return "error";
      default:
        return "neutral";
    }
  };

  const statusColorVariant = getStatusColor(item.status);

  const handleEdit = () => {
    bottomSheetRef.current?.close();
    router.push(`/service/${item.id}/edit` as any);
  };

  const handleLongPress = () => {
    bottomSheetRef.current?.present();
  };

  const handleDelete = () => {
    bottomSheetRef.current?.close();
    Alert.alert(
      t("service.deleteConfirm"),
      t("service.deleteMessage"),
      [
        { text: t("service.cancelBtn"), style: "cancel" },
        {
          text: t("service.deleteBtn"),
          style: "destructive",
          onPress: () => onDelete?.(item.id),
        },
      ],
    );
  };

  return (
    <>
      <Card className="mb-3 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center p-4"
          onPress={handleEdit}
          onLongPress={handleLongPress}
          delayLongPress={250}
        >
          {/* Icon */}
          <View className="w-12 h-12 rounded-xl bg-blue-500/10 items-center justify-center border border-blue-500/20">
            <Ionicons name="wifi" size={22} color="#3b82f6" />
          </View>

          <View className="flex-1 ml-3">
            {/* Customer Name */}
            <HighlightedText
              text={customerName}
              searchQuery={searchQuery}
              className="text-base text-foreground font-semibold"
              numberOfLines={1}
            />

            {/* Package + ID Pel */}
            <View className="flex-row items-center mt-0.5">
              <HighlightedText
                text={item.package_name}
                searchQuery={searchQuery}
                className="text-xs text-muted-foreground"
                numberOfLines={1}
              />
            </View>

            {/* IP Address */}
            {item.ip_address && (
              <HighlightedText
                text={`IP: ${item.ip_address}`}
                searchQuery={searchQuery}
                className="text-[11px] text-muted-foreground mt-0.5"
                numberOfLines={1}
              />
            )}

            {/* Status Badge */}
            <View className="flex-row mt-2">
              <Badge colorVariant={statusColorVariant}>
                {item.status}
              </Badge>
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["40%"]}
        title={customerName}
        description={`${item.package_name} • ${item.status}`}
        cancelLabel={t("service.cancelBtn")}
        actions={[
          {
            key: "edit",
            label: t("service.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "delete",
            label: t("service.deleteBtn"),
            onPress: handleDelete,
            icon: <Ionicons name="trash-outline" size={20} color="hsl(var(--destructive))" />,
            variant: "destructive",
            isLoading: isDeleting,
            disabled: isDeleting,
          },
        ]}
      />
    </>
  );
}
