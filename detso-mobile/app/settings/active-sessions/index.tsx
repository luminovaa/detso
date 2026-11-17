import React, { useCallback } from "react";
import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Card } from "@/src/components/global/card";
import { Badge } from "@/src/components/global/badge";
import { Button } from "@/src/components/global/button";
import { EmptyState } from "@/src/components/global/empty-state";
import { Skeleton } from "@/src/components/global/skeleton";
import { showToast } from "@/src/components/global/toast";

import { authService } from "@/src/features/auth/service";
import { useT, useLanguageStore } from "@/src/features/i18n/store";
import { showErrorToast } from "@/src/lib/api-error";
import { formatDateTime } from "@/src/lib/format-date";
import { useThemeColor } from "@/src/lib/theme-colors";

interface ActiveSession {
  id: string;
  device_info?: string | null;
  ip_address?: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  is_current?: boolean;
}

/**
 * Displays all currently active login sessions for the signed-in user
 * and allows revoking non-current sessions.
 */
export default function ActiveSessionsScreen() {
  const { t } = useT();
  const locale = useLanguageStore((s) => s.locale);
  const colors = useThemeColor();
  const qc = useQueryClient();

  const {
    data: response,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["auth", "active-sessions"],
    queryFn: () => authService.activeSessions(),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "active-sessions"] });
      showToast.success(t("common.success"), t("settings.sessionsPage.revokeSuccess"));
    },
    onError: (err) => {
      showErrorToast(err, t("settings.sessionsPage.revokeFailed"));
    },
  });

  const sessions: ActiveSession[] = response?.data || [];

  const handleRevoke = useCallback(
    (session: ActiveSession) => {
      Alert.alert(
        t("settings.sessionsPage.revokeConfirmTitle"),
        t("settings.sessionsPage.revokeConfirmDesc"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("settings.sessionsPage.revokeBtn"),
            style: "destructive",
            onPress: () => revokeMutation.mutate(session.id),
          },
        ]
      );
    },
    [revokeMutation, t]
  );

  return (
    <ScreenWrapper headerTitle={t("settings.sessionsPage.title")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text className="text-sm text-muted-foreground mb-4 px-1">
          {t("settings.sessionsPage.subtitle")}
        </Text>

        {isLoading ? (
          <View className="gap-y-3">
            {[1, 2].map((idx) => (
              <Skeleton key={idx} className="h-32 rounded-2xl" />
            ))}
          </View>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="phone-portrait-outline"
            title={t("settings.sessionsPage.emptyTitle")}
            description={t("settings.sessionsPage.emptyDesc")}
          />
        ) : (
          <View className="gap-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="rounded-2xl p-4 border-border/50">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
                      <Ionicons
                        name={session.is_current ? "phone-portrait" : "laptop-outline"}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text weight="semibold" className="text-sm text-foreground" numberOfLines={1}>
                        {session.device_info || t("settings.sessionsPage.unknownDevice")}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {t("settings.sessionsPage.ipLabel")}: {session.ip_address || "-"}
                      </Text>
                    </View>
                  </View>

                  {session.is_current && (
                    <Badge colorVariant="success">
                      {t("settings.sessionsPage.currentDevice")}
                    </Badge>
                  )}
                </View>

                <View className="mt-3 pt-3 border-t border-border/50 flex-row items-center justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">
                      {t("settings.sessionsPage.lastUpdated")}:{" "}
                      {formatDateTime(new Date(session.updated_at), locale)}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {t("settings.sessionsPage.expiresAt")}:{" "}
                      {formatDateTime(new Date(session.expires_at), locale)}
                    </Text>
                  </View>

                  {!session.is_current && (
                    <Button
                      title={t("settings.sessionsPage.revokeBtn")}
                      variant="outline"
                      size="sm"
                      disabled={revokeMutation.isPending}
                      onPress={() => handleRevoke(session)}
                    />
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
