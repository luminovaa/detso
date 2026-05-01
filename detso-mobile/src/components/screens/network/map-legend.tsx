import React from 'react';
import { View } from 'react-native';
import { Text } from '@/src/components/global/text';

export function MapLegend() {
  return (
    <View
      className="absolute bottom-28 left-3 bg-white/90 dark:bg-neutral-800/90 px-3 py-2 rounded-xl"
      style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
    >
      {/* Node types */}
      <View className="flex-row items-center gap-3 mb-1">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
          <Text className="text-[10px] text-foreground">Server</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-[#3b82f6]" />
          <Text className="text-[10px] text-foreground">ODP</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-[#10b981]" />
          <Text className="text-[10px] text-foreground">ONT</Text>
        </View>
      </View>
      {/* Line types */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <View className="w-4 h-[3px] bg-[#f97316] rounded-full" />
          <Text className="text-[10px] text-foreground">Fiber</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-4 h-[2px] bg-[#06b6d4] rounded-full" />
          <Text className="text-[10px] text-foreground">Drop</Text>
        </View>
      </View>
    </View>
  );
}
