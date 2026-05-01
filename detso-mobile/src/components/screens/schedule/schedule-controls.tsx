import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';

interface ScheduleControlsProps {
  onAddSchedule: () => void;
}

export function ScheduleControls({ onAddSchedule }: ScheduleControlsProps) {
  const { fabBottom } = useTabBarHeight();

  return (
    <View style={{ position: 'absolute', bottom: fabBottom, right: 16 }} className="gap-3">
      {/* Add Schedule Button */}
      <TouchableOpacity
        onPress={onAddSchedule}
        className="w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
