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

interface CustomerItemProps {
  item: ServiceConnection;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function CustomerItem({ item, searchQuery = "", onDelete, isDeleting }: CustomerItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const customerName = item.customer?.name || "-";
  const customerPhone = item.customer?.phone || "-";

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
    router.push(`/customer/${item.customer?.id}/edit`);
  };

  const handleLongPress = () => {
    bottomSheetRef.current?.present();
  };

  const handleDelete = () => {
    bottomSheetRef.current?.close();
    Alert.alert(
      t("customer.deleteConfirm"),
      t("customer.deleteMessage"),
      [
        { text: t("customer.cancelBtn"), style: "cancel" },
        {
          text: t("customer.deleteBtn"),
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
          <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="person" size={24} color="hsl(var(--primary))" />
          </View>

          <View className="flex-1 ml-3">
            {/* Name */}
            <HighlightedText
              text={customerName}
              searchQuery={searchQuery}
              className="text-base text-foreground font-semibold"
              numberOfLines={1}
            />

            {/* Phone */}
            <HighlightedText
              text={customerPhone}
              searchQuery={searchQuery}
              className="text-xs text-muted-foreground mt-0.5"
              numberOfLines={1}
            />

            {/* Package + Status */}
            <View className="flex-row items-center mt-2 gap-x-2">
              <Badge colorVariant="info">
                {item.package_name}
              </Badge>
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
        cancelLabel={t("customer.cancelBtn")}
        actions={[
          {
            key: "edit",
            label: t("customer.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "delete",
            label: t("customer.deleteBtn"),
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
