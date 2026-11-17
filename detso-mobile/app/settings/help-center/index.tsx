import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Card } from "@/src/components/global/card";
import { useT } from "@/src/features/i18n/store";
import { useThemeColor } from "@/src/lib/theme-colors";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * In-app Help Center screen displaying operational FAQs and app info.
 */
export default function HelpCenterScreen() {
  const { t } = useT();
  const colors = useThemeColor();
  const [expandedId, setExpandedId] = useState<string | null>("faq-1");

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      question: t("settings.helpCenterPage.q1"),
      answer: t("settings.helpCenterPage.a1"),
    },
    {
      id: "faq-2",
      question: t("settings.helpCenterPage.q2"),
      answer: t("settings.helpCenterPage.a2"),
    },
    {
      id: "faq-3",
      question: t("settings.helpCenterPage.q3"),
      answer: t("settings.helpCenterPage.a3"),
    },
  ];

  return (
    <ScreenWrapper headerTitle={t("settings.helpCenterPage.title")} showBackButton>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-muted-foreground mb-5 px-1">
          {t("settings.helpCenterPage.subtitle")}
        </Text>

        <Text weight="bold" className="text-base text-foreground mb-3 px-1">
          {t("settings.helpCenterPage.faqTitle")}
        </Text>

        <View className="gap-y-3 mb-6">
          {faqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className="rounded-2xl overflow-hidden border-border/50">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex-row items-center justify-between gap-3"
                >
                  <Text weight="semibold" className="text-sm text-foreground flex-1">
                    {item.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View className="px-4 pb-4 pt-1 border-t border-border/40">
                    <Text className="text-xs text-muted-foreground leading-5">
                      {item.answer}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        <Card className="rounded-2xl p-4">
          <View className="flex-row items-center gap-3 mb-1.5">
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text weight="semibold" className="text-sm text-foreground">
              {t("settings.helpCenterPage.appInfoTitle")}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground leading-5">
            {t("settings.helpCenterPage.appInfoDesc")}
          </Text>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
