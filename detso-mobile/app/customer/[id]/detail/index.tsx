import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, Alert, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Tabs } from "@/src/components/global/tabs";
import { Text } from "@/src/components/global/text";
import { Skeleton } from "@/src/components/global/skeleton";
import { useCustomer, useDeleteCustomer } from "@/src/features/customer/hooks";
import { useT } from "@/src/features/i18n/store";
import { CustomerInfoTab } from "@/src/components/screens/customer/customer-info-tab";
import { CustomerTicketsTab } from "@/src/components/screens/customer/customer-tickets-tab";
import { CustomerDocumentsTab } from "@/src/components/screens/customer/customer-documents-tab";
import { getWhatsAppUrl, getTelUrl } from "@/src/lib/phone-utils";

const TAB_OPTIONS = ["Info", "Tiket", "Dokumen"];

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(TAB_OPTIONS[0]);

  const { data: response, isLoading } = useCustomer(id);
  const deleteCustomer = useDeleteCustomer();

  const customer = response?.data;

  const handleEdit = useCallback(() => {
    router.push(`/customer/${id}/edit` as any);
  }, [id]);

  const handleCall = useCallback(async () => {
    if (!customer?.phone) return;

    const whatsappUrl = getWhatsAppUrl(customer.phone);
    const telUrl = getTelUrl(customer.phone);

    try {
      // Try WhatsApp first
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to phone dialer
        await Linking.openURL(telUrl);
      }
    } catch (error) {
      // If WhatsApp fails, fallback to dialer
      try {
        await Linking.openURL(telUrl);
      } catch (dialerError) {
        Alert.alert("Error", "Tidak dapat membuka aplikasi telepon");
      }
    }
  }, [customer?.phone]);

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

  // Header right: Edit button
  const headerRight = (
    <TouchableOpacity onPress={handleEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name="create-outline" size={22} color="hsl(var(--foreground))" />
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper headerTitle="Detail Customer" showBackButton>
        <View className="p-4 gap-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </View>
      </ScreenWrapper>
    );
  }

  // Not found
  if (!customer) {
    return (
      <ScreenWrapper headerTitle="Detail Customer" showBackButton>
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color="hsl(var(--muted-foreground))" />
          <Text className="text-base text-muted-foreground mt-3">Customer tidak ditemukan</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle={customer.name} showBackButton headerRightNode={headerRight}>
      {/* Tabs */}
      <View className="px-4 pt-3 pb-2">
        <Tabs options={TAB_OPTIONS} selectedValue={activeTab} onValueChange={setActiveTab} />
      </View>

      {/* Tab Content */}
      <View className="flex-1 px-4">
        {activeTab === "Info" && <CustomerInfoTab data={customer} />}
        {activeTab === "Tiket" && <CustomerTicketsTab customerId={id} />}
        {activeTab === "Dokumen" && (
          <CustomerDocumentsTab
            customerId={id}
            documents={customer.documents}
            customerName={customer.name}
            hasInstallationReport={customer.has_installation_report}
          />
        )}
      </View>

      {/* Fixed Bottom Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: safeBottom + 12 }}
      >
        <View className="flex-row items-center gap-x-3">
          {/* WhatsApp Call */}
          {customer.phone && (
            <TouchableOpacity
              onPress={handleCall}
              className="w-11 h-11 rounded-full border border-primary items-center justify-center"
            >
              <Ionicons name="logo-whatsapp" size={20} color="hsl(var(--primary))" />
            </TouchableOpacity>
          )}

          {/* Edit - Primary */}
          <TouchableOpacity
            onPress={handleEdit}
            className="flex-1 flex-row items-center justify-center gap-x-2 h-11 rounded-full bg-primary"
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text weight="semibold" className="text-sm text-white">Edit Customer</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={handleDelete}
            className="w-11 h-11 rounded-full border border-destructive items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="hsl(var(--destructive))" />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
