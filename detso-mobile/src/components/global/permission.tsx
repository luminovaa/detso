import React from "react";
import { View, StatusBar, Linking, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./text";
import { Button, ButtonProps } from "./button";
import { cn } from "../../lib/utils";
import { useT } from "@/src/features/i18n/store";

export type PermissionType = "camera" | "location" | "location_service";
//   | "notification";

type PermissionConfig = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  btn: string;
  btnVariant: ButtonProps["variant"];
};

interface PermissionScreenProps {
  type: PermissionType;
  onGrant: () => void;
  onClose: () => void;
  isDenied?: boolean;
}

export function PermissionScreen({
  type,
  onGrant,
  onClose,
  isDenied = false,
}: PermissionScreenProps) {
  const { t } = useT();
  
  // Konfigurasi dinamis berdasarkan tipe permission
  const getConfig = (): PermissionConfig => {
    switch (type) {
      case "camera":
        return {
          icon: "camera-outline" as const,
          iconBg: "bg-emerald-500/10",
          iconColor: "#10b981",
          title: t("permission.camera.title"),
          desc: t("permission.camera.desc"),
          btn: isDenied ? t("permission.camera.btnSettings") : t("permission.camera.btnAllow"),
          btnVariant: isDenied ? "outline" : "primary",
        };
      case "location":
        return {
          icon: "location-outline" as const,
          iconBg: "bg-blue-500/10",
          iconColor: "#3B82F6",
          title: t("permission.location.title"),
          desc: t("permission.location.desc"),
          btn: isDenied ? t("permission.location.btnSettings") : t("permission.location.btnAllow"),
          btnVariant: isDenied ? "outline" : "primary",
        };
      case "location_service":
        return {
          icon: "navigate-outline" as const,
          iconBg: "bg-amber-500/10",
          iconColor: "#F59E0B",
          title: t("permission.locationService.title"),
          desc: t("permission.locationService.desc"),
          btn: t("permission.locationService.btnSettings"),
          btnVariant: "destructive",
        };
    }
  };

  const current = getConfig();

  const handlePress = async () => {
    if (type === "location_service") {
      if (Platform.OS === "android") {
        Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS").catch(
          () => Linking.openSettings(),
        );
      } else {
        Linking.openSettings();
      }
    } else if (isDenied) {
      Linking.openSettings();
    } else {
      onGrant();
    }
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Set status bar ke mode gelap/terang secara otomatis */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Latar hitam transparan seperti modal Dialog */}
      <View className="absolute inset-0 z-50 justify-center items-center p-6 bg-black/60">
        {/* Kontainer Card */}
        <View className="bg-card rounded-[32px] p-8 items-center w-full max-w-md border border-border shadow-lg">
          {/* Ikon */}
          <View
            className={cn(
              "w-20 h-20 rounded-2xl items-center justify-center mb-6 border border-border/50",
              current.iconBg,
            )}
          >
            <Ionicons name={current.icon} size={44} color={current.iconColor} />
          </View>

          {/* Gunakan komponen Text kita agar font SF Pro melengkungnya otomatis terpakai */}
          <Text
            weight="bold"
            className="text-2xl text-foreground text-center mb-3"
          >
            {current.title}
          </Text>

          <Text className="text-muted-foreground text-center leading-relaxed mb-8 px-2">
            {current.desc}
          </Text>

          {/* Tombol Utama */}
          <Button
            title={current.btn}
            variant={current.btnVariant}
            onPress={handlePress}
            className="w-full mb-3" // Jarak ke tombol Nanti Saja
          />

                    {/* Tombol Batal/Nanti Saja */}
          <Button
            title={t("permission.btnLater")}
            variant="ghost"
            onPress={onClose}
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
