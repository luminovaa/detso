// src/components/screens/dashboard/quick-menu-section.tsx
import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/global/text";
import { QuickMenuCard } from "./quick-menu-card";
import { Card } from "@/src/components/global/card";
import { Ionicons } from "@expo/vector-icons";

export interface QuickMenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface QuickMenuSectionProps {
  title: string;
  items: QuickMenuItem[];
}

export const QuickMenuSection = React.memo(function QuickMenuSection({ 
  title, 
  items 
}: QuickMenuSectionProps) {
  return (
    <View className="mb-6">
      <Card className="p-4">
        {/* Header */}
        <Text weight="bold" className="text-lg text-foreground mb-4">
          {title}
        </Text>

        {/* Grid Layout - 3 columns x 2 rows */}
        <View className="gap-3">
          {/* First Row */}
          <View className="flex-row gap-3">
            {items.slice(0, 3).map((item, index) => (
              <QuickMenuCard
                key={`menu-${index}`}
                icon={item.icon}
                label={item.label}
                onPress={item.onPress}
              />
            ))}
          </View>

          {/* Second Row */}
          {items.length > 3 && (
            <View className="flex-row gap-3">
              {items.slice(3, 6).map((item, index) => (
                <QuickMenuCard
                  key={`menu-${index + 3}`}
                  icon={item.icon}
                  label={item.label}
                  onPress={item.onPress}
                />
              ))}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
});
