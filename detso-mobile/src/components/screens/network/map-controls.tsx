import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Text } from '@/src/components/global/text';
import { useNetworkMapStore } from '@/src/features/network/store';

interface MapControlsProps {
  onLocateMe: (lat: number, lng: number) => void;
  onAddNode: () => void;
}

export function MapControls({ onLocateMe, onAddNode }: MapControlsProps) {
  const { mode, cancelAdd } = useNetworkMapStore();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onLocateMe(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setIsLocating(false);
    }
  };

  // Show cancel button when in add_node mode
  if (mode === 'add_node') {
    return (
      <View className="absolute bottom-28 right-3 gap-3">
        <TouchableOpacity
          onPress={cancelAdd}
          className="w-12 h-12 rounded-full bg-red-500 items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="absolute bottom-28 right-3 gap-3">
      {/* Locate Me */}
      <TouchableOpacity
        onPress={handleLocateMe}
        disabled={isLocating}
        className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <Ionicons name="locate" size={22} color="#3b82f6" />
        )}
      </TouchableOpacity>

      {/* Add Node */}
      <TouchableOpacity
        onPress={onAddNode}
        className="w-12 h-12 rounded-full bg-primary items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}
      >
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/** Banner shown when in add_node mode */
export function AddNodeBanner() {
  const { mode, addNodeType } = useNetworkMapStore();

  if (mode !== 'add_node') return null;

  const label = addNodeType === 'SERVER' ? 'Server' : 'ODP';

  return (
    <View className="absolute top-28 left-4 right-4 z-20">
      <View
        className="bg-primary/95 px-4 py-3 rounded-xl flex-row items-center justify-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}
      >
        <Ionicons name="pin" size={18} color="white" />
        <Text weight="medium" className="text-white ml-2 text-sm">
          Tap pada peta untuk menempatkan {label}
        </Text>
      </View>
    </View>
  );
}
