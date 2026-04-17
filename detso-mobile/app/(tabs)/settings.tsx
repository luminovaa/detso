import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// --- Komponen Global Kita ---
import { Text } from "@/src/components/global/text";
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Avatar } from "@/src/components/global/avatar";
import { Card, CardContent } from "@/src/components/global/card";
import { Switch } from "@/src/components/global/switch";
import { Button } from "@/src/components/global/button";
import { 
  BottomSheet, 
  BottomSheetHeader, 
  BottomSheetTitle 
} from "@/src/components/global/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { cn } from "@/src/lib/utils";
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
import { Header } from "@/src/components/global/header";
import { SettingsSkeleton } from "@/src/features/settings/components/settings-skeleton";

export default function SettingsScreen() {
  // 1. Hooks & Global State
  const { user, logout, refreshUserData } = useAuthStore();
  const { locale, setLocale } = useLanguageStore();
  const { t } = useT();

  // 2. Refs
  const langSheetRef = useRef<BottomSheetModal>(null);

  // 3. Local State
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // 3. Functions
  const formatRole = (role: string) => {
    if (!role) return "User";
    const roles: Record<string, string> = {
      SAAS_SUPER_ADMIN: "Super Admin Detso",
      TENANT_OWNER: "Pemilik ISP",
      TENANT_ADMIN: "Admin ISP",
      TENANT_TEKNISI: "Teknisi Lapangan",
    };
    return roles[role] || role;
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleLanguage = () => {
    langSheetRef.current?.present();
  };

  const handleLanguageChange = async (newLocale: "id" | "en") => {
    langSheetRef.current?.dismiss();
    setIsLoading(true);
    setLocale(newLocale);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  // 4. Helper UI untuk Language Item
  const LanguageItem = ({ 
    label, 
    isActive, 
    onSelect, 
    isLast = false 
  }: { 
    label: string; 
    isActive: boolean; 
    onSelect: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onSelect}
      className={cn(
        "flex-row items-center justify-between p-4",
        !isLast && "border-b border-border/50"
      )}
    >
      <Text weight={isActive ? "bold" : "medium"} className={cn("text-base", isActive ? "text-primary" : "text-foreground")}>
        {label}
      </Text>
      {isActive && (
        <Ionicons name="checkmark-circle" size={22} color="hsl(var(--primary))" />
      )}
    </TouchableOpacity>
  );

  const onPullToRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Sinkronisasi data awal saat masuk ke halaman settings
    const init = async () => {
      try {
        await refreshUserData();
      } catch (error) {
        console.error("Initial load failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  return (
    // Memanggil ScreenWrapper dengan fitur Refresh
    <ScreenWrapper onRefresh={onPullToRefresh} refreshing={isRefreshing}>
      
      {/* --- HEADER --- */}
      <Header title={t("settings.title")} />

      {/* --- KONTEN UTAMA --- */}
      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <View className="flex-1 pt-4 pb-24">
        
        {/* --- 1. PROFILE SECTION --- */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="flex-row items-center p-5">
            <Avatar 
              src={user?.profile?.avatar}
              alt={user?.profile?.fullName || user?.username} 
              size="xl" 
              className="bg-primary/10"
            />
            
            <View className="flex-1 ml-4 justify-center">
              <Text weight="bold" className="text-lg text-foreground mb-1">
                {user?.profile?.fullName || user?.username || "Pengguna"}
              </Text>
              <View className="flex-row items-center">
                <View className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Text weight="semibold" className="text-[10px] text-primary uppercase">
                    {formatRole(user?.role || "")}
                  </Text>
                </View>
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
            {/* Bahasa */}
            <TouchableOpacity 
              onPress={toggleLanguage}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4 border-b border-border/50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="language" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.preferences.language")}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text weight="bold" className="text-primary mr-2 uppercase">
                  {locale}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="hsl(var(--muted-foreground))" />
              </View>
            </TouchableOpacity>

            {/* Notifikasi */}
            <View className="flex-row items-center justify-between p-4 border-b border-border/50">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="notifications" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.preferences.notifications")}
                </Text>
              </View>
              <Switch 
                checked={notifEnabled} 
                onCheckedChange={setNotifEnabled}
              />
            </View>

            {/* Tema */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="moon" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.preferences.theme")}
                </Text>
              </View>
              <Switch 
                checked={darkModeEnabled} 
                onCheckedChange={setDarkModeEnabled}
              />
            </View>
          </CardContent>
        </Card>

        {/* --- 3. SUPPORT SECTION --- */}
        <Text weight="bold" className="text-sm text-muted-foreground uppercase tracking-widest mb-3 ml-2">
          {t("settings.support.title")}
        </Text>

        <Card className="mb-10">
          <CardContent className="p-0">
            {/* Bantuan */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              className="flex-row items-center justify-between p-4 border-b border-border/50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="help-buoy" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.support.helpCenter")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="hsl(var(--muted-foreground))" />
            </TouchableOpacity>

            {/* Versi */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="information-circle" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.support.version")}
                </Text>
              </View>
              <Text weight="medium" className="text-muted-foreground text-sm">
                v1.0.0
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* --- 4. SECURITY SECTION --- */}
        <Text weight="bold" className="text-sm text-muted-foreground uppercase tracking-widest mb-3 ml-2">
          {t("settings.security.title")}
        </Text>

        <Card className="mb-10">
          <CardContent className="p-0">
            {/* Ganti Password */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              className="flex-row items-center justify-between p-4 border-b border-border/50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="lock-closed" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.security.changePassword")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="hsl(var(--muted-foreground))" />
            </TouchableOpacity>

            {/* Sesi Aktif */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              className="flex-row items-center justify-between p-4 border-b border-border/50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name="phone-portrait" size={20} color="hsl(var(--primary))" />
                </View>
                <Text weight="semibold" className="text-foreground text-base">
                  {t("settings.security.sessions")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="hsl(var(--muted-foreground))" />
            </TouchableOpacity>

            {/* Logout Item */}
            <TouchableOpacity 
              onPress={() => setIsLogoutDialogOpen(true)}
              activeOpacity={0.7} 
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-destructive/10 items-center justify-center mr-4">
                  <Ionicons name="log-out" size={20} color="hsl(var(--destructive))" />
                </View>
                <Text weight="semibold" className="text-destructive text-base">
                  {t("settings.logout")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="hsl(var(--destructive))" opacity={0.5} />
            </TouchableOpacity>
          </CardContent>
        </Card>

      </View>
      )}
      
      {/* 5. LOGOUT CONFIRMATION DIALOG */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.logoutConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.logoutConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              title={t("common.cancel")} 
              variant="outline" 
              onPress={() => setIsLogoutDialogOpen(false)}
              className="py-2"
              size="md"
            />
            <Button 
              title={t("settings.logout")} 
              variant="destructive" 
              onPress={() => {
                setIsLogoutDialogOpen(false);
                handleLogout();
              }}
              size="md"
              className="shadow-sm shadow-destructive/20"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. LANGUAGE SELECTION BOTTOM SHEET */}
      <BottomSheet ref={langSheetRef} snapPoints={["42%"]}>
        <BottomSheetHeader>
          <BottomSheetTitle>{t("settings.preferences.selectLanguage")}</BottomSheetTitle>
        </BottomSheetHeader>
        
        <View className="flex-1 justify-between">
          <Card className="overflow-hidden border-border/50">
            <LanguageItem 
              label={t("settings.preferences.langId")} 
              isActive={locale === "id"} 
              onSelect={() => handleLanguageChange("id")}
            />
            <LanguageItem 
              label={t("settings.preferences.langEn")} 
              isActive={locale === "en"} 
              isLast
              onSelect={() => handleLanguageChange("en")}
            />
          </Card>

          <Button 
            title={t("common.cancel")} 
            variant="outline" 
            onPress={() => langSheetRef.current?.dismiss()}
            className="mt-6 mb-2"
          />
        </View>
      </BottomSheet>
    </ScreenWrapper>
  );
}