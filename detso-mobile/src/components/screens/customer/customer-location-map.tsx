/**
 * CUSTOMER LOCATION MAP
 *
 * Displays service locations on a Mapbox map with the following features:
 * - Pan-enabled, zoom-disabled (fixed zoom based on bounds)
 * - Auto-fit camera to show all service markers
 * - Stacked markers for services at the same location (tap to cycle)
 * - Callout shows package name + address
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../global/card';
import { Text } from '../../global/text';

import { COLORS } from '@/src/lib/colors';
interface Service {
  id: string;
  lat: string | null;
  long: string | null;
  address: string | null;
  package_name: string;
}

interface CustomerLocationMapProps {
  services: Service[];
}

interface MarkerGroup {
  key: string;
  lat: number;
  long: number;
  services: Service[];
}

export function CustomerLocationMap({ services }: CustomerLocationMapProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({});

  // Filter valid services with coordinates
  const validServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.lat &&
        s.long &&
        s.lat !== '0' &&
        s.long !== '0' &&
        s.lat !== '0.0' &&
        s.long !== '0.0'
    );
  }, [services]);

  // Group services by coordinates (for stacked markers)
  const markerGroups = useMemo(() => {
    const groups: Record<string, MarkerGroup> = {};

    validServices.forEach((service) => {
      const key = `${service.lat},${service.long}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          lat: parseFloat(service.lat!),
          long: parseFloat(service.long!),
          services: [],
        };
      }
      groups[key].services.push(service);
    });

    return Object.values(groups);
  }, [validServices]);

  // Calculate bounds for auto-fit
  const bounds = useMemo(() => {
    if (markerGroups.length === 0) return null;

    const lats = markerGroups.map((g) => g.lat);
    const longs = markerGroups.map((g) => g.long);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.2 || 0.01;
    const longPadding = (maxLong - minLong) * 0.2 || 0.01;

    return {
      ne: [maxLong + longPadding, maxLat + latPadding] as [number, number],
      sw: [minLong - longPadding, minLat - latPadding] as [number, number],
    };
  }, [markerGroups]);

  // Auto-fit camera on mount
  useEffect(() => {
    if (bounds && cameraRef.current) {
      setTimeout(() => {
        cameraRef.current?.fitBounds(bounds.ne, bounds.sw, [50, 50, 50, 50], 500);
      }, 300);
    }
  }, [bounds]);

  // Handle marker press (cycle through stacked services)
  const handleMarkerPress = (key: string, servicesAtLocation: Service[]) => {
    if (servicesAtLocation.length <= 1) return;

    const currentIndex = activeIndices[key] || 0;
    const nextIndex = (currentIndex + 1) % servicesAtLocation.length;
    setActiveIndices({ ...activeIndices, [key]: nextIndex });
  };

  if (markerGroups.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-border/40">
      <View className="h-[200px] w-full">
        <Mapbox.MapView
          style={{ flex: 1 }}
          styleURL={Mapbox.StyleURL.Street}
          zoomEnabled={false}
          scrollEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera ref={cameraRef} />

          {markerGroups.map((group) => {
            const activeIndex = activeIndices[group.key] || 0;
            const activeService = group.services[activeIndex];

            return (
              <Mapbox.MarkerView
                key={group.key}
                coordinate={[group.long, group.lat]}
                anchor={{ x: 0.5, y: 1 }}
              >
                <TouchableOpacity
                  onPress={() => handleMarkerPress(group.key, group.services)}
                  activeOpacity={0.7}
                  className="items-center"
                >
                  {/* Pin Container */}
                  <View className="relative">
                    {/* Pin Icon */}
                    <View className="w-8 h-8 items-center justify-center">
                      <Ionicons name="location" size={28} color={COLORS.brand.primary} />
                    </View>

                    {/* Badge for multiple services */}
                    {group.services.length > 1 && (
                      <View className="absolute -top-1 -right-1 bg-destructive rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-[10px] text-white font-semibold">
                          {group.services.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Callout */}
                  <View className="mt-1 bg-card border border-border rounded-lg p-2 min-w-[180px] max-w-[220px] shadow-sm">
                    <Text weight="semibold" className="text-[13px] text-foreground" numberOfLines={1}>
                      {activeService.package_name}
                    </Text>
                    {activeService.address && (
                      <Text className="text-[11px] text-muted-foreground mt-1" numberOfLines={2}>
                        {activeService.address}
                      </Text>
                    )}
                    {group.services.length > 1 && (
                      <Text className="text-[9px] text-muted-foreground mt-1 italic">
                        Tap untuk lihat layanan lain ({activeIndex + 1}/{group.services.length})
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Mapbox.MarkerView>
            );
          })}
        </Mapbox.MapView>
      </View>
    </Card>
  );
}
