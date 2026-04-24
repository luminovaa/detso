import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

// --- Komponen Global ---
import { Text } from "@/src/components/global/text";
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Avatar } from "@/src/components/global/avatar";
import { Card, CardContent } from "@/src/components/global/card";
import { Switch } from "@/src/components/global/switch";
import { Button } from "@/src/components/global/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/src/components/global/dialog";

// --- State & Logic ---
import { useAuthStore } from "@/src/features/auth/store";
import { useLanguageStore, useT } from "@/src/features/i18n/store";
import { useThemeStore } from "@/src/features/theme/store";

// --- Feature Components ---
import { SettingsSkeleton } from "@/src/components/screens/settings/settings-skeleton";
import { SettingRow } from "@/src/components/screens/settings/setting-row";
import { LanguageSheet } from "@/src/components/screens/settings/language-sheet";
import { ThemeSheet } from "@/src/components/screens/settings/theme-sheet";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";

export default function SettingsScreen() {
  const { user, logout, refreshUserData } = useAuthStore();
  const { locale, setLocale } = useLanguageStore();
  const { theme } = useThemeStore();
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();

  const langSheetRef = useRef<BottomSheetModal>(null);
  const themeSheetRef = useRef<BottomSheetModal>(null);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      SAAS_SUPER_ADMIN: "Super Admin Detso",
      TENANT_OWNER: "Pemilik ISP",
      TENANT_ADMIN: "Admin ISP",
      TENANT_TEKNISI: "Teknisi Lapangan",
    };
    return roles[role] || role || "User";
  };

  const onPullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserData();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await refreshUserData();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLanguageChange = async (newLocale: "id" | "en") => {
    setIsLoading(true);
    setLocale(newLocale);
    // Berikan delay sedikit agar user bisa melihat skeleton (pengalaman UX)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

    if (isLoading) return (
    <ScreenWrapper headerTitle={t("settings.title")}>
      <SettingsSkeleton />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper 
      headerTitle={t("settings.title")}
      onRefresh={onPullToRefresh} 
      refreshing={isRefreshing}
    >
      <>
        
        <View className="flex-1 pt-4" style={{ paddingBottom: contentPaddingBottom }}>
          <Card className="mb-8 overflow-hidden">
            <CardContent className="flex-row items-center p-5">
              <Avatar 
                src={user?.profile?.avatar}
                alt={user?.profile?.full_name || user?.username} 
                size="xl" 
                className="bg-primary/10"
              />
              
              <View className="flex-1 ml-4 justify-center">
                <Text weight="bold" className="text-lg text-foreground mb-1">
                  {user?.profile?.full_name || user?.username || "Pengguna"}
                </Text>
                <View className="px-2 py-0.5 self-start rounded-full bg-primary/10 border border-primary/20">
                  <Text weight="semibold" className="text-[10px] text-primary uppercase">
                    {formatRole(user?.role || "")}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {user?.email}
                </Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => router.push("/settings/edit-profile")}
                className="w-10 h-10 bg-muted rounded-full items-center justify-center border border-border/50"
              >
                <Ionicons name="pencil" size={18} color="hsl(var(--foreground))" />
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* --- 2. PREFERENCES SECTION --- */}
          <Text weight="bold" className="text-sm text-muted-foreground uppercase tracking-widest mb-3 ml-2">
            {t("settings.preferences.title")}
          </Text>
          <Card className="mb-8">
            <CardContent className="p-0">
              <SettingRow 
                label={t("settings.preferences.language")}
                iconName="language"
                value={locale === "id" ? t("settings.preferences.langId") : t("settings.preferences.langEn")}
                onPress={() => langSheetRef.current?.present()}
              />
              <SettingRow 
                label={t("settings.preferences.notifications")}
                iconName="notifications"
                rightNode={<Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />}
              />
              <SettingRow 
                label={t("settings.preferences.theme")}
                iconName="moon"
                value={
                  theme === "light" ? t("settings.preferences.themeLight") :
                  theme === "dark" ? t("settings.preferences.themeDark") :
                  t("settings.preferences.themeSystem")
                }
                isLast
                onPress={() => themeSheetRef.current?.present()}
              />
            </CardContent>
          </Card>

          {/* --- 3. SUPPORT SECTION --- */}
          <Text weight="bold" className="text-sm text-muted-foreground uppercase tracking-widest mb-3 ml-2">
            {t("settings.support.title")}
          </Text>
          <Card className="mb-10">
            <CardContent className="p-0">
              <SettingRow 
                label={t("settings.support.helpCenter")}
                iconName="help-buoy"
                onPress={() => {}}
              />
              <SettingRow 
                label={t("settings.support.version")}
                iconName="information-circle"
                rightNode={<Text weight="medium" className="text-muted-foreground text-sm">v1.0.0</Text>}
                isLast
              />
            </CardContent>
          </Card>

          {/* --- 4. SECURITY SECTION --- */}
          <Text weight="bold" className="text-sm text-muted-foreground uppercase tracking-widest mb-3 ml-2">
            {t("settings.security.title")}
          </Text>
          <Card className="mb-10">
            <CardContent className="p-0">
              <SettingRow 
                label={t("settings.security.changePassword")}
                iconName="lock-closed"
                onPress={() => router.push("/settings/change-password")}
              />
              <SettingRow 
                label={t("settings.security.sessions")}
                iconName="phone-portrait"
                onPress={() => {}}
              />
              <SettingRow 
                label={t("settings.logout")}
                iconName="log-out"
                iconBgColor="bg-destructive/10"
                destructive
                isLast
                onPress={() => setIsLogoutDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </View>

        {/* --- MODALS & SHEETS --- */}
        <LanguageSheet ref={langSheetRef} onSelect={handleLanguageChange} />
        <ThemeSheet ref={themeSheetRef} />
      </>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.logoutConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("settings.logoutConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button title={t("common.cancel")} variant="outline" onPress={() => setIsLogoutDialogOpen(false)} />
            <Button 
              title={t("settings.logout")} 
              variant="destructive" 
              onPress={async () => {
                setIsLogoutDialogOpen(false);
                await logout();
              }} 
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenWrapper>
  );
}