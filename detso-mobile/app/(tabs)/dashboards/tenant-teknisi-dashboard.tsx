import React from "react";
import { View } from "react-native";
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { useAuthStore } from "@/src/features/auth/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useT } from "@/src/features/i18n/store";

export default function TenantTeknisiDashboard() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
    >
      <View className="flex-1 justify-center items-center px-6" style={{ paddingBottom: contentPaddingBottom }}>
        <Text weight="bold" className="text-2xl text-foreground mb-2">
          {t("teknisiDashboard.title")}
        </Text>
        <Text className="text-muted-foreground text-center">
          {t("teknisiDashboard.welcome", { name: user?.profile?.full_name || user?.username })}
        </Text>
        <Text className="text-muted-foreground text-center mt-4">
          {t("teknisiDashboard.comingSoon")}
        </Text>
      </View>
    </ScreenWrapper>
  );
}
