import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Header } from "@/src/components/global/header";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Avatar } from "@/src/components/global/avatar";
import { Badge } from "@/src/components/global/badge";
import { Skeleton } from "@/src/components/global/skeleton";

// --- State & Logic ---
import { tenantService } from "@/src/features/tenant/service";
import { useT } from "@/src/features/i18n/store";
import { Tenant } from "@/src/lib/types";

export default function ISPDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colorScheme } = useColorScheme();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const response = await tenantService.getById(id);
      setTenant(response.data);
    } catch (error) {
      console.error("Fetch ISP detail error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDetail();
  };

  const isDark = colorScheme === "dark";
  const primaryColor = isDark ? "#66a3ff" : "#102a4d";

  if (isLoading && !tenant) {
    return (
      <ScreenWrapper>
        <Header title={t("isp.detailTitle")} showBackButton />
        <View className="p-4 gap-y-6">
          <View className="items-center gap-y-4">
            <Skeleton className="w-24 h-24 rounded-3xl" />
            <Skeleton className="w-48 h-8 rounded-md" />
            <Skeleton className="w-24 h-6 rounded-full" />
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-[48%] h-24 rounded-2xl" />
            ))}
          </View>
          <Card className="p-4 gap-y-4 border-border/40">
             <Skeleton className="w-32 h-5 rounded-md" />
             <Skeleton className="w-full h-4 rounded-md" />
             <Skeleton className="w-full h-4 rounded-md" />
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  if (!tenant) return null;

  const StatCard = ({ icon, label, value, colorClass = "text-primary" }: any) => (
    <Card className="w-[48%] p-4 border-border/40 bg-card">
      <View className="flex-row items-center mb-2">
        <View className="p-2 rounded-xl bg-muted/50">
          <Ionicons name={icon} size={20} color={isDark ? "#66a3ff" : "#102a4d"} />
        </View>
      </View>
      <Text weight="bold" className={`text-xl ${colorClass}`}>
        {value.toLocaleString()}
      </Text>
      <Text className="text-xs text-muted-foreground">
        {label}
      </Text>
    </Card>
  );

  return (
    <ScreenWrapper>
      <Header title={t("isp.detailTitle")} showBackButton />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[primaryColor]} tintColor={primaryColor} />
        }
      >
        {/* Header Profile */}
        <View className="items-center mb-8">
          <Avatar 
            src={tenant.logo} 
            alt={tenant.name} 
            size="2xl" 
            className="mb-4 bg-primary/5 border-2 border-primary/10 rounded-[32px]" 
          />
          <Text weight="bold" className="text-2xl text-foreground text-center mb-2">
            {tenant.name}
          </Text>
          <Badge variant={tenant.is_active ? "success" : "destructive"}>
            {tenant.is_active ? t("isp.active") : t("isp.inactive")}
          </Badge>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-8 gap-y-4">
          <StatCard 
            icon="people-outline" 
            label={t("isp.totalUsers")} 
            value={tenant.stats.total_users} 
          />
          <StatCard 
            icon="person-outline" 
            label={t("isp.customers")} 
            value={tenant.stats.total_customers} 
          />
          <StatCard 
            icon="cube-outline" 
            label={t("isp.totalPackages")} 
            value={tenant.stats.total_packages} 
            colorClass="text-orange-500"
          />
          <StatCard 
            icon="ticket-outline" 
            label={t("isp.totalTickets")} 
            value={tenant.stats.total_tickets} 
            colorClass="text-destructive"
          />
          <StatCard 
            icon="flash-outline" 
            label={t("isp.services")} 
            value={tenant.stats.active_services} 
            colorClass="text-green-600"
          />
        </View>

        {/* Contact Info */}
        <Card className="p-6 border-border/40 bg-card mb-4">
          <Text weight="bold" className="text-base text-foreground mb-4">
            {t("isp.contactInfo")}
          </Text>
          
          <View className="gap-y-5">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/50 items-center justify-center mr-4">
                <Ionicons name="location-outline" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text weight="semibold" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {t("isp.address")}
                </Text>
                <Text className="text-sm text-foreground leading-5">
                  {tenant.address}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/50 items-center justify-center mr-4">
                <Ionicons name="call-outline" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text weight="semibold" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {t("isp.phone")}
                </Text>
                <Text className="text-sm text-foreground">
                  {tenant.phone}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-muted/50 items-center justify-center mr-4">
                <Ionicons name="calendar-outline" size={20} color="gray" />
              </View>
              <View className="flex-1">
                <Text weight="semibold" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {t("isp.createdAt")}
                </Text>
                <Text className="text-sm text-foreground">
                  {new Date(tenant.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
