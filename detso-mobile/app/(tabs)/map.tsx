import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/global/text";
import { useT } from "@/src/features/i18n/store";

export default function Map() {
  const { t } = useT();

  return (
    <View>
      <Text>{t("tabs.map")}</Text>
    </View>
  );
}
