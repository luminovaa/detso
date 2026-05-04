import React, { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Button } from "@/src/components/global/button";

// --- State & Logic ---
import { useNetworkNode, useDeleteNode } from "@/src/features/network/hooks";
import { useT } from "@/src/features/i18n/store";
import { COLORS } from "@/src/lib/colors";

export default function OdpDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "destructive";
      case "SUSPENDED":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("odp.title")} showBackButton>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!node) {
    return (
      <ScreenWrapper headerTitle={t("odp.title")} showBackButton>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.neutral.gray[400]} />
          <Text className="text-muted-foreground text-center mt-4">
            {t("common.notFound")}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={node.name} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ODP Info Card */}
        <View className="bg-card rounded-2xl border border-border/50 p-5 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
              <Ionicons name="git-network-outline" size={24} color={COLORS.brand.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text weight="bold" className="text-lg text-foreground">
                {node.name}
              </Text>
              {node.address && (
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {node.address}
                </Text>
              )}
            </View>
          </View>

          {/* Slot Usage */}
          {node.slot && (
            <View className="flex-row items-center justify-between py-3 border-t border-border/30">
              <Text className="text-sm text-muted-foreground">{t("odp.slotUsage")}</Text>
              <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full">
                <Ionicons name="git-branch-outline" size={16} color={COLORS.brand.primary} />
                <Text weight="bold" className="text-sm text-primary ml-1.5">
                  {linksFrom.filter((l: any) => l.to_service_id).length} / {node.slot}
                </Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {node.notes && (
            <View className="pt-3 border-t border-border/30">
              <Text className="text-sm text-muted-foreground mb-1">{t("odp.notesLabel")}</Text>
              <Text className="text-sm text-foreground">{node.notes}</Text>
            </View>
          )}
        </View>

        {/* Parent Server Section */}
        {(node.parent || linksTo.length > 0) && (
          <View className="mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("odp.parentServer")}
            </Text>
            <View className="bg-card rounded-2xl border border-border/50 p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-teal-500/10 rounded-full items-center justify-center">
                  <Ionicons name="server-outline" size={20} color={COLORS.network.nodeServer} />
                </View>
                <View className="ml-3 flex-1">
                  <Text weight="semibold" className="text-foreground">
                    {node.parent?.name || linksTo[0]?.from_node?.name || "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Connected Services Section */}
        <View className="mb-4">
          <Text weight="bold" className="text-base text-foreground mb-3">
            {t("odp.connectedServices")}
          </Text>

          {linksFrom.length === 0 ? (
            <View className="bg-card rounded-2xl border border-border/50 p-6 items-center">
              <Ionicons name="link-outline" size={32} color={COLORS.neutral.gray[400]} />
              <Text className="text-muted-foreground text-sm mt-2">
                {t("odp.noConnections")}
              </Text>
            </View>
          ) : (
            <View className="gap-y-2">
              {linksFrom
                .filter((link: any) => link.to_service)
                .map((link: any) => {
                  const svc = link.to_service;
                  return (
                    <TouchableOpacity
                      key={link.id}
                      activeOpacity={0.7}
                      className="bg-card rounded-2xl border border-border/50 p-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                          <Text weight="semibold" className="text-foreground">
                            {svc.customer?.name || "-"}
                          </Text>
                          {svc.customer?.phone && (
                            <Text className="text-xs text-muted-foreground mt-0.5">
                              {svc.customer.phone}
                            </Text>
                          )}
                          {svc.package_name && (
                            <Text className="text-xs text-muted-foreground mt-0.5">
                              {svc.package_name}
                            </Text>
                          )}
                          {svc.address && (
                            <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                              {svc.address}
                            </Text>
                          )}
                        </View>
                        {svc.status && (
                          <Badge colorVariant={
                            svc.status === 'ACTIVE' ? 'success' :
                            svc.status === 'SUSPENDED' ? 'warning' : 'error'
                          }>
                            {svc.status}
                          </Badge>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-background border-t border-border/10">
        <View className="flex-row gap-x-3">
          <Button
            title={t("odp.deleteBtn")}
            variant="destructive"
            size="md"
            className="flex-1"
            onPress={handleDelete}
            isLoading={deleteNode.isPending}
          />
          <Button
            title={t("common.edit")}
            variant="primary"
            size="md"
            className="flex-1"
            onPress={() => router.push(`/odp/${id}/edit`)}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
