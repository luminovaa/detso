import React from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { QuickMenuCard } from "@/src/components/screens/dashboard/quick-menu-card";

import { useT } from "@/src/features/i18n/store";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

export default function AllMenuScreen() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const { contentPaddingBottom } = useTabBarHeight();
  
  const isOwner = user?.role === 'TENANT_OWNER';

  // Main Features (5 items)
  const mainFeatures = [
    {
      icon: "wifi",
      label: t("allMenu.services"),
      onPress: () => router.push("/service"),
    },
    {
      icon: "people",
      label: t("allMenu.customers"),
      onPress: () => router.push("/customer"),
    },
    {
      icon: "pricetag",
      label: t("allMenu.packages"),
      onPress: () => router.push("/package"),
    },
    {
      icon: "document-text",
      label: t("allMenu.tickets"),
      onPress: () => router.push("/ticket"),
    },
    {
      icon: "git-network",
      label: t("allMenu.odp"),
      onPress: () => router.push("/odp"),
    },
    {
      icon: "person",
      label: t("allMenu.team"),
      onPress: () => router.push("/team"),
    },
  ];

  // Settings & Account (3-4 items, conditional based on role)
  const settingsItems = [
    {
      icon: "person-circle",
      label: t("allMenu.editProfile"),
      onPress: () => router.push("/settings/edit-profile"),
    },
    {
      icon: "lock-closed",
      label: t("allMenu.changePassword"),
      onPress: () => router.push("/settings/change-password"),
    },
    ...(isOwner
      ? [
          {
            icon: "business",
            label: t("allMenu.editCompany"),
            onPress: () => router.push("/settings/edit-tenant"),
          },
        ]
      : []),
    {
      icon: "help-circle",
      label: t("allMenu.helpCenter"),
      onPress: () => console.log("Navigate to Help Center"),
    },
  ];

  return (
    <ScreenWrapper
      headerTitle={t("allMenu.title")}
      showBackButton={true}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      >
        {/* Main Features Section */}
        <View className="mt-4">
          <Text weight="bold" className="text-lg text-foreground mb-3">
            {t("allMenu.mainFeatures")}
          </Text>
          
          {/* Grid Layout - 3 columns */}
          <View className="flex-row flex-wrap gap-3">
            {mainFeatures.map((item, index) => (
              <View key={`main-${index}`} className="w-[31%]">
                <QuickMenuCard
                  icon={item.icon as any}
                  label={item.label}
                  onPress={item.onPress}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Settings & Account Section */}
        <View className="mt-6">
          <Text weight="bold" className="text-lg text-foreground mb-3">
            {t("allMenu.settingsAccount")}
          </Text>
          
          {/* Grid Layout - 3 columns */}
          <View className="flex-row flex-wrap gap-3">
            {settingsItems.map((item, index) => (
              <View key={`settings-${index}`} className="w-[31%]">
                <QuickMenuCard
                  icon={item.icon as any}
                  label={item.label}
                  onPress={item.onPress}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
