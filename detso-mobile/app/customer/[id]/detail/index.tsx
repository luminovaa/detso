import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, Alert, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Tabs } from "@/src/components/global/tabs";
import { Text } from "@/src/components/global/text";
import { Skeleton } from "@/src/components/global/skeleton";
import { useCustomer, useDeleteCustomer } from "@/src/features/customer/hooks";
import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { canManageRecords } from "@/src/lib/route-roles";
import { CustomerInfoTab } from "@/src/components/screens/customer/customer-info-tab";
import { CustomerTicketsTab } from "@/src/components/screens/customer/customer-tickets-tab";
import { CustomerDocumentsTab } from "@/src/components/screens/customer/customer-documents-tab";
import { getWhatsAppUrl, getWhatsAppWebUrl } from "@/src/lib/phone-utils";

import { useThemeColor } from '@/src/lib/theme-colors';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const canManage = canManageRecords(user?.role);
  const tabOptions = [
    t("customer.tabInfo"),
    t("customer.tabTickets"),
    t("customer.tabDocuments"),
  ];
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const { data: response, isLoading } = useCustomer(id);
  const deleteCustomer = useDeleteCustomer();

  const customer = response?.data;

  const handleEdit = useCallback(() => {
    router.push(`/customer/${id}/edit`);
  }, [id]);

  const handleCall = useCallback(async () => {
    if (!customer?.phone) return;

    const whatsappUrl = getWhatsAppUrl(customer.phone);
    const whatsappWebUrl = getWhatsAppWebUrl(customer.phone);

    try {
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch {
      // Fall through to universal https://wa.me URL
    }

    try {
      await Linking.openURL(whatsappWebUrl);
    } catch {
      Alert.alert(t("common.error"), t("customer.whatsappError"));
    }
  }, [customer?.phone, t]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("customer.deleteConfirm"),
      t("customer.deleteMessage"),
      [
        { text: t("customer.cancelBtn"), style: "cancel" },
        {
          text: t("customer.deleteBtn"),
          style: "destructive",
          onPress: () => {
            deleteCustomer.mutate(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }, [id, deleteCustomer, t]);

  // Header right: Edit button (Owner & Admin only)
  const headerRight = canManage ? (
    <TouchableOpacity
      onPress={handleEdit}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="min-h-11 min-w-11 items-center justify-center rounded-full"
    >
      <Ionicons name="create-outline" size={22} color={colors.white} />
    </TouchableOpacity>
  ) : undefined;

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper headerTitle={t("customer.detailTitle")} showBackButton>
        <View className="p-4 gap-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-10 rounded-2xl" />
          <View className="bg-card border border-border rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3.5 gap-3 border-b border-border/60">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-32 h-4 rounded" />
            </View>
            <View className="flex-row items-center justify-between px-4 py-3.5 gap-3">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-32 h-4 rounded" />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Not found
  if (!customer) {
    return (
      <ScreenWrapper headerTitle={t("customer.detailTitle")} showBackButton>
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.iconMuted} />
          <Text className="text-base text-muted-foreground mt-3">{t("customer.notFound")}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={customer.name} showBackButton headerRightNode={headerRight}>
      {/* Tabs */}
      <View className="pt-3 pb-2">
        <Tabs
          options={tabOptions}
          selectedValue={tabOptions[activeTabIndex]}
          onValueChange={(val) => {
            const idx = tabOptions.indexOf(val);
            if (idx !== -1) setActiveTabIndex(idx);
          }}
        />
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTabIndex === 0 && <CustomerInfoTab data={customer} />}
        {activeTabIndex === 1 && <CustomerTicketsTab customerId={id} />}
        {activeTabIndex === 2 && (
          <CustomerDocumentsTab
            customerId={id}
            documents={customer.documents}
            services={customer.services}
            customerName={customer.name}
            hasInstallationReport={customer.has_installation_report}
          />
        )}
      </View>

      {/* Fixed Bottom Actions */}
      {(canManage || Boolean(customer.phone)) && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pt-3 pb-2"
        >
          <View className="flex-row items-center gap-x-3">
            {canManage ? (
              <>
                {/* WhatsApp */}
                {customer.phone && (
                  <TouchableOpacity
                    onPress={handleCall}
                    className="min-w-11 min-h-11 w-11 h-11 rounded-full border border-primary items-center justify-center"
                  >
                    <Ionicons name="logo-whatsapp" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Edit - Primary */}
                <TouchableOpacity
                  onPress={handleEdit}
                  className="flex-1 flex-row items-center justify-center gap-x-2 min-h-11 h-11 rounded-full bg-primary"
                >
                  <Ionicons name="create-outline" size={18} color={colors.white} />
                  <Text weight="semibold" className="text-sm text-primary-foreground">
                    {t("customer.editBtn")}
                  </Text>
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={handleDelete}
                  className="min-w-11 min-h-11 w-11 h-11 rounded-full border border-destructive items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </>
            ) : (
              customer.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  className="flex-1 flex-row items-center justify-center gap-x-2 min-h-11 h-11 rounded-full bg-primary"
                >
                  <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
                  <Text weight="semibold" className="text-sm text-primary-foreground">
                    {t("customer.whatsappBtn")}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
