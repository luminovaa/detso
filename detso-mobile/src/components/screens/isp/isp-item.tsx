import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../global/card";
import { Avatar } from "../../global/avatar";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { Tenant } from "@/src/lib/types";
import { useT } from "@/src/features/i18n/store";
import { router } from "expo-router";

import { COLORS } from '@/src/lib/colors';
export const ISPItem = React.memo(function ISPItem({ item }: { item: Tenant }) {
  const { t } = useT();

  const handlePress = useCallback(() => {
    router.push(`/isp/${item.id}/detail`);
  }, [item.id]);

  return (
    <Card className="mb-4 overflow-hidden border-border/40">
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center p-4"
        onPress={handlePress}
      >
        <Avatar
          src={item.logo || undefined}
          alt={item.name}
          size="lg"
          className="bg-primary/5 border border-primary/10"
        />

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-start mb-1">
            <Text
              weight="bold"
              className="text-base text-foreground flex-1 mr-2"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Badge variant={item.is_active ? "success" : "destructive"}>
              {item.is_active ? t("isp.active") : t("isp.inactive")}
            </Badge>
          </View>

          <Text
            className="text-xs text-muted-foreground mb-3"
            numberOfLines={1}
          >
            {item.phone} • {item.address}
          </Text>

          <View className="flex-row gap-x-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-primary mr-1.5" />
              <Text weight="semibold" className="text-[11px] text-primary">
                {item.stats.total_customers.toLocaleString()}{" "}
                {t("isp.customers")}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
              <Text weight="semibold" className="text-[11px] text-orange-500">
                {item.stats.active_services.toLocaleString()}{" "}
                {t("isp.services")}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.neutral.gray[500]}
          className="ml-2"
        />
      </TouchableOpacity>
    </Card>
  );
});
