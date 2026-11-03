import React, { useRef, useCallback, useMemo } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Badge } from "../../global/badge";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { Package } from "@/src/lib/types";
import { useThemeColor } from "@/src/lib/theme-colors";
interface PackageItemProps {
  item: Package;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const priceFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

export const PackageItem = React.memo(function PackageItem({ item, searchQuery = "", onDelete, isDeleting }: PackageItemProps) {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role !== "TENANT_TEKNISI";
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const formattedPrice = useMemo(() => priceFormatter.format(item.price), [item.price]);

  const handlePress = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleEdit = useCallback(() => {
    bottomSheetRef.current?.close();
    router.push(`/package/${item.id}/edit`);
  }, [item.id]);

  const handleDetail = useCallback(() => {
    bottomSheetRef.current?.close();
    router.push(`/package/${item.id}/detail`);
  }, [item.id]);

  const handleDelete = useCallback(() => {
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
  }, [item.id, onDelete, t]);

  return (
    <>
      <Card className="rounded-2xl mb-3 overflow-hidden border-border/40">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center p-4"
          onPress={handleDetail}
          onLongPress={handlePress}
          delayLongPress={250}
        >
          {/* Icon Package */}
          <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
            <Ionicons name="cube" size={28} color={colors.primary} />
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
              <Ionicons name="speedometer-outline" size={14} color={colors.textMuted} />
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
              <Badge colorVariant="success">
                {formattedPrice}
              </Badge>
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePress}
            className="min-w-11 min-h-11 items-center justify-center -mr-2"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["45%"]}
        title={item.name}
        description={`${item.speed} • ${formattedPrice}`}
        cancelLabel={t("package.cancelBtn")}
        actions={[
          {
            key: "detail",
            label: t("package.detailTitle"),
            onPress: handleDetail,
            icon: <Ionicons name="eye-outline" size={20} color={colors.primary} />,
            variant: "default",
          },
          ...(canManage
            ? [
                {
                  key: "edit",
                  label: t("package.editTitle"),
                  onPress: handleEdit,
                  icon: <Ionicons name="pencil-outline" size={20} color={colors.primary} />,
                  variant: "default" as const,
                },
                {
                  key: "delete",
                  label: t("package.deleteBtn"),
                  onPress: handleDelete,
                  icon: <Ionicons name="trash-outline" size={20} color={colors.error} />,
                  variant: "destructive" as const,
                  isLoading: isDeleting,
                  disabled: isDeleting,
                },
              ]
            : []),
        ]}
      />
    </>
  );
});
