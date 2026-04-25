import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CustomTabBar } from "@/src/components/global/custom-tab-bar";
import { useAuthStore } from "@/src/features/auth/store";
import { useT } from "@/src/features/i18n/store";

export default function TabLayout() {
  const { user } = useAuthStore();
  const { t } = useT();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t("tabs.schedule"),
          href: user?.role === "SAAS_SUPER_ADMIN" ? null : undefined,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="isp"
        options={{
          title: t("tabs.isp"),
          href: user?.role !== "SAAS_SUPER_ADMIN" ? null : undefined,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("tabs.map"),
          href: user?.role === "SAAS_SUPER_ADMIN" ? null : undefined,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
