import React, { useRef } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { Package } from "@/src/lib/types";

interface PackageItemProps {
  item: Package;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function PackageItem({ item, searchQuery = "", onDelete, isDeleting }: PackageItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePress = () => {
    bottomSheetRef.current?.present();
  };

  const handleEdit = () => {
    bottomSheetRef.current?.close();
    router.push(`/package/${item.id}/edit`);
  };

  const handleDetail = () => {
    bottomSheetRef.current?.close();
    router.push(`/package/${item.id}/detail`);
  };

  const handleDelete = () => {
    bottomSheetRef.current?.close();
    Alert.alert(
      t("package.deleteConfirm"),
      t("package.deleteMessage"),
      [
        {
          text: t("package.cancelBtn"),
          style: "cancel",
        },
        {
          text: t("package.deleteBtn"),
          style: "destructive",
          onPress: () => onDelete?.(item.id),
        },
      ],
    );
  };

  return (
    <>
      <Card className="mb-4 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center p-4"
          onLongPress={handlePress}
          delayLongPress={250}
        >
          {/* Icon Package */}
          <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="cube" size={28} color="hsl(var(--primary))" />
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row justify-between items-start mb-1">
              <HighlightedText
                text={item.name}
                searchQuery={searchQuery}
                className="text-base text-foreground font-semibold flex-1 mr-2"
                numberOfLines={1}
              />
            </View>

            <View className="flex-row items-center mb-2">
              <Ionicons name="speedometer-outline" size={14} color="hsl(var(--muted-foreground))" />
              <View className="ml-1 flex-1">
                <HighlightedText
                  text={item.speed}
                  searchQuery={searchQuery}
                  className="text-xs text-muted-foreground"
                  numberOfLines={1}
                />
              </View>
            </View>

            <View className="flex-row items-center">
              <Badge variant="default" className="bg-green-500/10 border-green-500/20">
                <Text weight="semibold" className="text-xs text-green-600">
                  {formatPrice(item.price)}
                </Text>
              </Badge>
            </View>
          </View>

          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color="hsl(var(--muted-foreground))"
            className="ml-2"
          />
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["45%"]}
        title={item.name}
        description={`${item.speed} • ${formatPrice(item.price)}`}
        cancelLabel={t("package.cancelBtn")}
        actions={[
          {
            key: "detail",
            label: t("package.detailTitle"),
            onPress: handleDetail,
            icon: <Ionicons name="eye-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "edit",
            label: t("package.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "delete",
            label: t("package.deleteBtn"),
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
