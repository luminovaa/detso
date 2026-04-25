import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/global/text";
import { useT } from "@/src/features/i18n/store";

export default function Schedule() {
  const { t } = useT();

  return (
    <View>
      <Text>{t("tabs.schedule")}</Text>
    </View>
  );
}
