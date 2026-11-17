import React, { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { Badge } from "../../global/badge";
import { Avatar } from "../../global/avatar";
import { CustomerLocationMap } from "./customer-location-map";
import { CustomerDocument, ServicePhoto } from "@/src/lib/types";
import { SERVICE_STATUS_VARIANTS } from "@/src/lib/status-variants";
import { formatDate } from "@/src/lib/format-date";
import { hasAnyValidLocation } from "@/src/lib/map-utils";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { useThemeColor } from "@/src/lib/theme-colors";
import { useAuthStore } from "@/src/features/auth/store";
import { useT } from "@/src/features/i18n/store";
interface CustomerData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nik: string | null;
  created_at: string;
  documents: CustomerDocument[];
  services: {
    id: string;
    package_name: string;
    package_speed: string;
    status: string;
    address: string | null;
    ip_address: string | null;
    mac_address: string | null;
    lat: string | null;
    long: string | null;
    created_at: string;
    package_details: { name: string; speed: string; price: number } | null;
    photos: ServicePhoto[];
  }[];
}

interface CustomerInfoTabProps {
  data: CustomerData;
}

export function CustomerInfoTab({ data }: CustomerInfoTabProps) {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);

  const handleCall = useCallback(() => {
    if (data.phone) Linking.openURL(`tel:${data.phone}`);
  }, [data.phone]);

  const handleEmail = useCallback(() => {
    if (data.email) Linking.openURL(`mailto:${data.email}`);
  }, [data.email]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Hero Card */}
      <Card className="rounded-2xl mb-4 border-border/40">
        <View className="p-5 items-center">
          <Avatar src={null} alt={data.name} size="2xl" className="mb-3 bg-primary/5 border-2 border-primary/10" />
          <Text weight="bold" className="text-xl text-foreground text-center mb-1">
            {data.name}
          </Text>

          {/* Contact Row */}
          <View className="flex-row items-center gap-x-4 mt-3">
            {data.phone && (
              <TouchableOpacity onPress={handleCall} className="flex-row items-center gap-x-1">
                <Ionicons name="call-outline" size={14} color={colors.primary} />
                <Text className="text-sm text-primary">{data.phone}</Text>
              </TouchableOpacity>
            )}
            {data.email && (
              <TouchableOpacity onPress={handleEmail} className="flex-row items-center gap-x-1">
                <Ionicons name="mail-outline" size={14} color={colors.primary} />
                <Text className="text-sm text-primary" numberOfLines={1}>{data.email}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Grid */}
          <View className="flex-row mt-4 gap-x-6">
            {!isTeknisi && data.nik && (
              <View className="items-center">
                <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {t("customer.nikLabelShort")}
                </Text>
                <Text weight="semibold" className="text-sm text-foreground mt-0.5">{data.nik}</Text>
              </View>
            )}
            <View className="items-center">
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {t("customer.registeredLabel")}
              </Text>
              <Text weight="semibold" className="text-sm text-foreground mt-0.5">
                {formatDate(new Date(data.created_at))}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Location Map */}
      {hasAnyValidLocation(data.services) && (
        <View className="mb-4">
          <Text weight="bold" className="text-base text-foreground mb-3 px-1">
            {t("customer.serviceLocationTitle")}
          </Text>
          <CustomerLocationMap services={data.services} />
        </View>
      )}

      {/* Service Connections */}
      {data.services.length > 0 && (
        <View className="mb-4">
          <Text weight="bold" className="text-base text-foreground mb-3 px-1">
            {t("customer.servicesTitle")} ({data.services.length})
          </Text>

          {data.services.map((service) => (
            <Card key={service.id} className="rounded-2xl mb-3 border-border/40">
              <TouchableOpacity
                activeOpacity={0.7}
                className="p-4"
                onPress={() =>
                  router.push(
                    isTeknisi
                      ? `/service/${service.id}/detail`
                      : `/service/${service.id}/edit`
                  )
                }
              >
                {/* Package + Status */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-x-2">
                    <Ionicons name="wifi" size={16} color={colors.primary} />
                    <Text weight="semibold" className="text-base text-foreground">
                      {service.package_name}
                    </Text>
                  </View>
                  <Badge colorVariant={SERVICE_STATUS_VARIANTS[service.status] || "neutral"}>
                    {service.status}
                  </Badge>
                </View>

                {/* Speed */}
                <View className="flex-row items-center mb-1">
                  <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
                  <Text className="text-xs text-muted-foreground ml-1">{service.package_speed}</Text>
                </View>

                {/* Address */}
                {service.address && (
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text className="text-xs text-muted-foreground ml-1 flex-1" numberOfLines={2}>
                      {service.address}
                    </Text>
                  </View>
                )}

                {/* IP + MAC */}
                <View className="flex-row items-center gap-x-4 mt-1">
                  {service.ip_address && (
                    <View className="flex-row items-center">
                      <Text className="text-[11px] text-muted-foreground">IP: </Text>
                      <Text weight="medium" className="text-[11px] text-foreground">{service.ip_address}</Text>
                    </View>
                  )}
                  {service.mac_address && (
                    <View className="flex-row items-center">
                      <Text className="text-[11px] text-muted-foreground">MAC: </Text>
                      <Text weight="medium" className="text-[11px] text-foreground">{service.mac_address}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}

      {/* Empty services */}
      {data.services.length === 0 && (
        <Card className="rounded-2xl mb-4 border-border/40">
          <View className="p-6 items-center">
            <Ionicons name="wifi-outline" size={32} color={colors.textMuted} />
            <Text className="text-sm text-muted-foreground mt-2">{t("customer.noServices")}</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
