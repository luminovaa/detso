import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/src/components/global/text';
import { MapFilterType } from '@/src/features/network/types';
import { useNetworkMapStore } from '@/src/features/network/store';

const FILTERS: { key: MapFilterType; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'SERVER', label: 'Server' },
  { key: 'ODP', label: 'ODP' },
  { key: 'ONT', label: 'Customer' },
];

export function MapFilterBar() {
  const { filterType, setFilter } = useNetworkMapStore();

  return (
    <View className="absolute top-14 left-0 right-0 z-10 px-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {FILTERS.map((filter) => {
            const isActive = filterType === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setFilter(filter.key)}
                className={`px-4 py-2 rounded-full ${
                  isActive ? 'bg-primary' : 'bg-white/90 dark:bg-neutral-800/90'
                }`}
                style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              >
                <Text
                  weight={isActive ? 'bold' : 'medium'}
                  className={`text-sm ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
