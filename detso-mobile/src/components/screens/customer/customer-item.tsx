import React, { useRef, useCallback } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { Text } from "../../global/text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { CustomerListItem } from "@/src/lib/types";
import { SERVICE_STATUS_VARIANTS } from "@/src/lib/status-variants";

interface CustomerItemProps {
  item: CustomerListItem;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export const CustomerItem = React.memo(function CustomerItem({ item, searchQuery = "", onDelete, isDeleting }: CustomerItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePress = useCallback(() => {
    router.push(`/customer/${item.id}/detail` as any);
  }, [item.id]);

  const handleEdit = useCallback(() => {
    bottomSheetRef.current?.close();
    router.push(`/customer/${item.id}/edit`);
  }, [item.id]);

  const handleLongPress = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleDelete = useCallback(() => {
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
  }, [item.id, onDelete, t]);

  // Get unique statuses from services (max 3)
  const uniqueStatuses = [...new Set(item.services_summary.map(s => s.status))].slice(0, 3);

  return (
    <>
      <Card className="mb-3 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center p-4"
          onPress={handlePress}
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
              text={item.name}
              searchQuery={searchQuery}
              className="text-base text-foreground font-semibold"
              numberOfLines={1}
            />

            {/* Phone */}
            <HighlightedText
              text={item.phone || "-"}
              searchQuery={searchQuery}
              className="text-xs text-muted-foreground mt-0.5"
              numberOfLines={1}
            />

            {/* Service count + Status badges */}
            <View className="flex-row items-center mt-2 gap-x-2 flex-wrap">
              <Badge colorVariant="info">
                {item.service_count} Layanan
              </Badge>
              {uniqueStatuses.map((status) => (
                <Badge key={status} colorVariant={SERVICE_STATUS_VARIANTS[status] || "neutral"}>
                  {status}
                </Badge>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["40%"]}
        title={item.name}
        description={`${item.service_count} Layanan`}
        cancelLabel={t("customer.cancelBtn")}
        actions={[
          {
            key: "detail",
            label: "Detail",
            onPress: handlePress,
            icon: <Ionicons name="eye-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
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
});
