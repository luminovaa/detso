import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/src/features/auth/store";
import { Detso_Role } from "@/src/features/auth/schema";

import SaasSuperAdminDashboard from "./dashboards/saas-super-admin-dashboard";
import TenantOwnerDashboard from "./dashboards/tenant-owner-dashboard";
import TenantAdminDashboard from "./dashboards/tenant-admin-dashboard";
import TenantTeknisiDashboard from "./dashboards/tenant-teknisi-dashboard";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";

function UnknownRoleDashboard() {
  const user = useAuthStore((s) => s.user);
  
  return (
    <ScreenWrapper headerTitle="Dashboard">
      <View className="flex-1 justify-center items-center px-6">
        <Text weight="bold" className="text-xl text-foreground mb-2">
          Role Tidak Dikenali
        </Text>
        <Text className="text-muted-foreground text-center">
          Role: {user?.role || "Unknown"}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  // Loading state saat user belum tersedia
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render dashboard berdasarkan role
  switch (user.role) {
    case Detso_Role.SAAS_SUPER_ADMIN:
      return <SaasSuperAdminDashboard />;
    
    case Detso_Role.TENANT_OWNER:
      return <TenantOwnerDashboard />;
    
    case Detso_Role.TENANT_ADMIN:
      return <TenantAdminDashboard />;
    
    case Detso_Role.TENANT_TEKNISI:
      return <TenantTeknisiDashboard />;
    
    default:
      return <UnknownRoleDashboard />;
  }
}