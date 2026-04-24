// src/components/screens/dashboard/metric-card.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}

export function MetricCard({ icon, label, value, color, onPress }: MetricCardProps) {
  const Content = (
    <Card className="flex-1">
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
        </View>
        
        <Text weight="bold" className="text-3xl text-foreground mb-1">
          {value.toLocaleString()}
        </Text>
        
        <Text className="text-sm text-muted-foreground">
          {label}
        </Text>
      </CardContent>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} className="flex-1">
        {Content}
      </TouchableOpacity>
    );
  }

  return <View className="flex-1">{Content}</View>;
}
