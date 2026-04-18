import React, { forwardRef } from "react";
import { View } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { 
  BottomSheet, 
  BottomSheetHeader, 
  BottomSheetTitle 
} from "@/src/components/global/bottom-sheet";
import { Card } from "@/src/components/global/card";
import { Button } from "@/src/components/global/button";
import { useT } from "@/src/features/i18n/store";
import { useThemeStore } from "@/src/features/theme/store";
import { SelectionItem } from "./setting-row";

export const ThemeSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const { t } = useT();
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // @ts-ignore
    ref?.current?.dismiss();
  };

  return (
    <BottomSheet ref={ref} snapPoints={["48%"]}>
      <BottomSheetHeader>
        <BottomSheetTitle>{t("settings.preferences.selectTheme")}</BottomSheetTitle>
      </BottomSheetHeader>
      
      <View className="flex-1 justify-between">
        <Card className="overflow-hidden border-border/50">
          <SelectionItem 
            label={t("settings.preferences.themeLight")} 
            isActive={theme === "light"} 
            iconName="sunny-outline"
            onSelect={() => handleThemeChange("light")}
          />
          <SelectionItem 
            label={t("settings.preferences.themeDark")} 
            isActive={theme === "dark"} 
            iconName="moon-outline"
            onSelect={() => handleThemeChange("dark")}
          />
          <SelectionItem 
            label={t("settings.preferences.themeSystem")} 
            isActive={theme === "system"} 
            iconName="contrast-outline"
            isLast
            onSelect={() => handleThemeChange("system")}
          />
        </Card>

        <Button 
          title={t("common.cancel")} 
          variant="outline" 
          // @ts-ignore
          onPress={() => ref?.current?.dismiss()}
          className="mt-6 mb-2"
        />
      </View>
    </BottomSheet>
  );
});
ThemeSheet.displayName = "ThemeSheet";
