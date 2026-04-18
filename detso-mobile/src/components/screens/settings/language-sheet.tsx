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
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { SelectionItem } from "./setting-row";

interface LanguageSheetProps {
  onSelect: (newLocale: "id" | "en") => void;
}

export const LanguageSheet = forwardRef<BottomSheetModal, LanguageSheetProps>(({ onSelect }, ref) => {
  const { t } = useT();
  const { locale } = useLanguageStore();

  const handleLanguageChange = async (newLocale: "id" | "en") => {
    // @ts-ignore
    ref?.current?.dismiss();
    onSelect(newLocale);
  };

  return (
    <BottomSheet ref={ref} snapPoints={["42%"]}>
      <BottomSheetHeader>
        <BottomSheetTitle>{t("settings.preferences.selectLanguage")}</BottomSheetTitle>
      </BottomSheetHeader>
      
      <View className="flex-1 justify-between">
        <Card className="overflow-hidden border-border/50">
          <SelectionItem 
            label={t("settings.preferences.langId")} 
            isActive={locale === "id"} 
            iconName="language-outline"
            onSelect={() => handleLanguageChange("id")}
          />
          <SelectionItem 
            label={t("settings.preferences.langEn")} 
            isActive={locale === "en"} 
            iconName="globe-outline"
            isLast
            onSelect={() => handleLanguageChange("en")}
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
LanguageSheet.displayName = "LanguageSheet";
