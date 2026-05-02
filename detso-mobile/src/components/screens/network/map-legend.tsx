import React from 'react';
import { View } from 'react-native';
import { Text } from '@/src/components/global/text';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { useT } from '@/src/features/i18n/store';

export function MapLegend() {
  const { t } = useT();
  const { fabBottom } = useTabBarHeight();

  return (
    <View
      className="absolute bg-white/90 dark:bg-neutral-800/90 px-3 py-2 rounded-xl"
      style={{ position: 'absolute', bottom: fabBottom, left: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
    >
      {/* Node types */}
      <View className="flex-row items-center gap-3 mb-1">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-node-server" />
          <Text className="text-[10px] text-foreground">{t('network.legend.server')}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-node-odp" />
          <Text className="text-[10px] text-foreground">{t('network.legend.odp')}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-service-active" />
          <Text className="text-[10px] text-foreground">{t('network.legend.ont')}</Text>
        </View>
      </View>
      {/* Line types */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <View className="w-4 h-[3px] bg-fiber-line rounded-full" />
          <Text className="text-[10px] text-foreground">{t('network.legend.fiber')}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-4 h-[2px] bg-drop-cable rounded-full" />
          <Text className="text-[10px] text-foreground">{t('network.legend.drop')}</Text>
        </View>
      </View>
    </View>
  );
}
