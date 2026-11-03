import React, { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Button } from "@/src/components/global/button";
import { GroupedSection } from "@/src/components/screens/dashboard/grouped-section";

// --- State & Logic ---
import { useNetworkNode, useDeleteNode } from "@/src/features/network/hooks";
import { useT } from "@/src/features/i18n/store";
import { useThemeColor } from "@/src/lib/theme-colors";

export default function OdpDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const colors = useThemeColor();
  const { data, isLoading } = useNetworkNode(id);
  const deleteNode = useDeleteNode();

  const node = data?.data;
  const linksFrom = node?.links_from || []; // services connected to this ODP
  const linksTo = node?.links_to || []; // parent server link

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("odp.deleteConfirm"),
      t("odp.deleteMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("odp.deleteBtn"),
          style: "destructive",
          onPress: () => {
            deleteNode.mutate(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ]
    );
  }, [deleteNode, id, t]);


  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("odp.title")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!node) {
    return (
      <ScreenWrapper headerTitle={t("odp.title")} showBackButton>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color={colors.iconMuted} />
          <Text className="text-muted-foreground text-center mt-4">
            {t("common.notFound")}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const connectedLinks = linksFrom.filter((link: any) => link.to_service);
  const usedSlots = linksFrom.filter((l: any) => l.to_service_id).length;

  const infoRows: { label: string; value: string }[] = [
    { label: t("odp.title"), value: node.name },
  ];
  if (node.address) {
    infoRows.push({ label: t("isp.address"), value: node.address });
  }
  if (node.slot) {
    infoRows.push({
      label: t("odp.slotUsage"),
      value: `${usedSlots} / ${node.slot}`,
    });
  }
  if (node.notes) {
    infoRows.push({ label: t("odp.notesLabel"), value: node.notes });
  }

  return (
    <ScreenWrapper headerTitle={node.name} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ODP Hero Summary */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-6 flex-row items-center">
          <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
            <Ionicons name="git-network-outline" size={24} color={colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text weight="bold" className="text-lg text-foreground">
              {node.name}
            </Text>
            {node.address ? (
              <Text className="text-sm text-muted-foreground mt-0.5">
                {node.address}
              </Text>
            ) : null}
          </View>
          {node.slot ? (
            <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full">
              <Ionicons name="git-branch-outline" size={14} color={colors.primary} />
              <Text weight="bold" className="text-xs text-primary ml-1.5">
                {usedSlots} / {node.slot}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ODP Metadata Grouped Rows */}
        <GroupedSection title={t("odp.title")}>
          {infoRows.map((row, idx) => {
            const isLast = idx === infoRows.length - 1;
            return (
              <View
                key={row.label}
                className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
              >
                <Text className="text-sm text-muted-foreground">{row.label}</Text>
                <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
                  {row.value}
                </Text>
              </View>
            );
          })}
        </GroupedSection>

        {/* Parent Server Section */}
        {(node.parent || linksTo.length > 0) && (
          <GroupedSection title={t("odp.parentServer")}>
            <View className="flex-row items-center justify-between px-4 py-3.5 gap-3">
              <Text className="text-sm text-muted-foreground">{t("odp.parentServer")}</Text>
              <Text weight="semibold" className="text-sm text-foreground text-right flex-1">
                {node.parent?.name || linksTo[0]?.from_node?.name || "-"}
              </Text>
            </View>
          </GroupedSection>
        )}

        {/* Connected Services Section */}
        <GroupedSection title={t("odp.connectedServices")}>
          {connectedLinks.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Ionicons name="link-outline" size={28} color={colors.iconMuted} />
              <Text className="text-muted-foreground text-sm mt-2">
                {t("odp.noConnections")}
              </Text>
            </View>
          ) : (
            connectedLinks.map((link: any, index: number) => {
              const svc = link.to_service;
              const isLast = index === connectedLinks.length - 1;
              return (
                <TouchableOpacity
                  key={link.id}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between px-4 py-3.5 gap-3 ${isLast ? "" : "border-b border-border/60"}`}
                >
                  <View className="flex-1">
                    <Text weight="semibold" className="text-sm text-foreground">
                      {svc.customer?.name || "-"}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {[svc.package_name, svc.customer?.phone, svc.address]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  </View>
                  {svc.status && (
                    <Badge
                      colorVariant={
                        svc.status === "ACTIVE"
                          ? "success"
                          : svc.status === "SUSPENDED"
                            ? "warning"
                            : "error"
                      }
                    >
                      {svc.status}
                    </Badge>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </GroupedSection>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-2 bg-background border-t border-border">
        <View className="flex-row gap-x-3">
          <Button
            title={t("odp.deleteBtn")}
            variant="destructive"
            size="md"
            className="flex-1 min-h-11"
            onPress={handleDelete}
            isLoading={deleteNode.isPending}
          />
          <Button
            title={t("common.edit")}
            variant="primary"
            size="md"
            className="flex-1 min-h-11"
            onPress={() => router.push(`/odp/${id}/edit`)}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
