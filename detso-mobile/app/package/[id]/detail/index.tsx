import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Card } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { Skeleton } from "@/src/components/global/skeleton";
import { Button } from "@/src/components/global/button";
import { showToast } from "@/src/components/global/toast";

// --- State & Logic ---
import { packageService } from "@/src/features/package/service";
import { useT } from "@/src/features/i18n/store";
import { useMutation } from "@/src/hooks/use-async";
import { showErrorToast } from "@/src/lib/api-error";

interface PackageData {
  id: string;
  name: string;
  speed: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colorScheme } = useColorScheme();

  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { mutate: mutateDelete, isLoading: isDeleting } = useMutation();

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const response = await packageService.getById(id);
      setPackageData(response.data);
    } catch (error) {
      showErrorToast(error, t("common.loadFailed"));
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

  const handleEdit = () => {
    router.push(`/package/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      t("package.deleteConfirm"),
      t("package.deleteMessage"),
      [
        {
          text: t("package.cancelBtn"),
          style: "cancel",
        },
        {
          text: t("package.deleteBtn"),
          style: "destructive",
          onPress: async () => {
            await mutateDelete(
              () => packageService.delete(id!),
              {
                onSuccess: () => {
                  showToast.success(t("common.success"), t("package.successDelete"));
                  router.back();
                },
                toastTitle: t("common.error"),
              },
            );
          },
        },
      ],
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isDark = colorScheme === "dark";

  if (isLoading && !packageData) {
    return (
      <ScreenWrapper headerTitle={t("package.detailTitle")} showBackButton>
        <View className="p-4 gap-y-6">
          <View className="items-center gap-y-4">
            <Skeleton className="w-24 h-24 rounded-3xl" />
            <Skeleton className="w-48 h-8 rounded-xl" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </View>
          <View className="gap-y-4">
            <Skeleton className="w-full h-20 rounded-2xl" />
            <Skeleton className="w-full h-20 rounded-2xl" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerTitle={t("package.detailTitle")}
      showBackButton
      headerRightNode={
        <Button variant="ghost" size="sm" onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color="hsl(var(--primary))" />
        </Button>
      }
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["hsl(var(--primary))"]}
            tintColor="hsl(var(--primary))"
          />
        }
      >
        {/* Package Icon & Name */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center border border-primary/20 mb-4">
            <Ionicons name="cube" size={48} color="hsl(var(--primary))" />
          </View>
          <Text weight="bold" className="text-2xl text-foreground text-center">
            {packageData?.name}
          </Text>
        </View>

        {/* Price Card */}
        <Card className="mb-4 border-border/40">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3">
              <View className="w-10 h-10 rounded-full bg-green-500/10 items-center justify-center">
                <Ionicons name="pricetag" size={20} color="#22c55e" />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">
                  {t("package.priceLabel")}
                </Text>
                <Text weight="bold" className="text-xl text-green-600">
                  {packageData ? formatPrice(packageData.price) : "-"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Speed Card */}
        <Card className="mb-4 border-border/40">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3">
              <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                <Ionicons name="speedometer" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">
                  {t("package.speedLabel")}
                </Text>
                <Text weight="semibold" className="text-lg text-foreground">
                  {packageData?.speed}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 border-border/40">
          <View className="gap-y-4">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">{t("package.createdAt")}</Text>
              <Text weight="medium">{packageData ? formatDate(packageData.created_at) : "-"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">{t("package.updatedAt")}</Text>
              <Text weight="medium">{packageData ? formatDate(packageData.updated_at) : "-"}</Text>
            </View>
          </View>
        </Card>

        {/* Delete Button */}
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onPress={handleDelete}
          isLoading={isDeleting}
          disabled={isDeleting}
          title={t("package.deleteBtn")}
          leftIcon={<Ionicons name="trash-outline" size={20} color="white" />}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
