import React, { useRef } from "react";
import { TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Badge } from "../../global/badge";
import { Avatar } from "../../global/avatar";
import { HighlightedText } from "../../global/highlighted-text";
import { ActionSheet } from "../../global/action-sheet";
import { useT } from "@/src/features/i18n/store";
import { TeamMember } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";

interface TeamItemProps {
  item: TeamMember;
  searchQuery?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function TeamItem({ item, searchQuery = "", onDelete, isDeleting }: TeamItemProps) {
  const { t } = useT();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const displayName = item.profile?.full_name || item.username;
  const roleLabel = t(`roles.${item.role}`) || item.role;

  const getRoleBadgeColor = (role: string): BadgeVariantKey => {
    switch (role) {
      case "TENANT_OWNER":
        return "warning";
      case "TENANT_ADMIN":
        return "info";
      case "TENANT_TEKNISI":
        return "success";
      default:
        return "neutral";
    }
  };

  const roleColorVariant = getRoleBadgeColor(item.role);

  const handlePress = () => {
    bottomSheetRef.current?.present();
  };

  const handleEdit = () => {
    bottomSheetRef.current?.close();
    router.push(`/team/${item.id}/edit`);
  };

  const handleDelete = () => {
    bottomSheetRef.current?.close();
    Alert.alert(
      t("team.deleteConfirm"),
      t("team.deleteMessage"),
      [
        { text: t("team.cancelBtn"), style: "cancel" },
        {
          text: t("team.deleteBtn"),
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
          onLongPress={handlePress}
          delayLongPress={250}
        >
          {/* Avatar */}
          <Avatar
            src={item.profile?.avatar}
            alt={displayName}
            size="lg"
            className="border-2 border-primary/10"
          />

          <View className="flex-1 ml-3">
            {/* Name */}
            <HighlightedText
              text={displayName}
              searchQuery={searchQuery}
              className="text-base text-foreground font-semibold"
              numberOfLines={1}
            />

            {/* Email */}
            <HighlightedText
              text={item.email}
              searchQuery={searchQuery}
              className="text-xs text-muted-foreground mt-0.5"
              numberOfLines={1}
            />

            {/* Role Badge */}
            <View className="flex-row mt-2">
              <Badge colorVariant={roleColorVariant}>
                {roleLabel}
              </Badge>
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      <ActionSheet
        ref={bottomSheetRef}
        snapPoints={["40%"]}
        title={displayName}
        description={`${roleLabel} • ${item.email}`}
        cancelLabel={t("team.cancelBtn")}
        actions={[
          {
            key: "edit",
            label: t("team.editTitle"),
            onPress: handleEdit,
            icon: <Ionicons name="pencil-outline" size={20} color="hsl(var(--primary))" />,
            variant: "default",
          },
          {
            key: "delete",
            label: t("team.deleteBtn"),
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
