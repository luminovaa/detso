/**
 * CUSTOMER LOCATION MAP
 *
 * Displays service locations on a Mapbox map with the following features:
 * - Pan-enabled, zoom-disabled (fixed zoom based on bounds)
 * - Auto-fit camera to show all service markers
 * - Stacked markers for services at the same location (tap to cycle)
 * - Callout shows package name + address
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../global/card';
import { Text } from '../../global/text';
import { useThemeColor } from '@/src/lib/theme-colors';
import { hasValidCoords, openLocationInMaps } from '@/src/lib/map-utils';
import { useT } from '@/src/features/i18n/store';
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
  const { t } = useT();
  const colors = useThemeColor();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({});
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  // Filter valid services with coordinates
  const validServices = useMemo(() => {
    return services.filter((s) => hasValidCoords(s.lat, s.long));
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

  // Calculate bounds for auto-fit when multiple pins exist
  const bounds = useMemo(() => {
    if (markerGroups.length <= 1) return null;

    const lats = markerGroups.map((g) => g.lat);
    const longs = markerGroups.map((g) => g.long);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    const latPadding = Math.max((maxLat - minLat) * 0.1, 0.0005);
    const longPadding = Math.max((maxLong - minLong) * 0.1, 0.0005);

    return {
      ne: [maxLong + longPadding, maxLat + latPadding] as [number, number],
      sw: [minLong - longPadding, minLat - latPadding] as [number, number],
    };
  }, [markerGroups]);

  const fitMultiMarkerBounds = useCallback(() => {
    if (bounds && cameraRef.current) {
      cameraRef.current.fitBounds(bounds.ne, bounds.sw, [38, 80, 78, 80], 300);
    }
  }, [bounds]);

  // Auto-fit camera on mount / bounds update
  useEffect(() => {
    if (!bounds) return;
    const timer = setTimeout(fitMultiMarkerBounds, 300);
    return () => clearTimeout(timer);
  }, [bounds, fitMultiMarkerBounds]);

  const handleOpenMaps = useCallback(
    async (lat: number, long: number, label?: string) => {
      const opened = await openLocationInMaps(lat, long, label);
      if (!opened) {
        Alert.alert(t('common.error'), t('customer.mapsError'));
      }
    },
    [t]
  );

  const currentGroup =
    markerGroups.find((g) => g.key === selectedGroupKey) || markerGroups[0];
  const currentActiveIndex = currentGroup ? activeIndices[currentGroup.key] || 0 : 0;
  const currentService = currentGroup?.services[currentActiveIndex];

  // Handle marker press:
  // - Multi-marker: first tap selects the marker; tapping an already-selected single-service marker opens Maps.
  // - Stacked marker (>1 service at same pin): cycles active service on tap.
  const handleMarkerPress = (group: MarkerGroup) => {
    const isAlreadySelected = currentGroup?.key === group.key;
    setSelectedGroupKey(group.key);

    if (markerGroups.length > 1 && !isAlreadySelected) {
      return;
    }

    if (group.services.length <= 1) {
      const svc = group.services[0];
      handleOpenMaps(group.lat, group.long, svc?.package_name);
      return;
    }

    const currentIndex = activeIndices[group.key] || 0;
    const nextIndex = (currentIndex + 1) % group.services.length;
    setActiveIndices({ ...activeIndices, [group.key]: nextIndex });
  };

  if (markerGroups.length === 0 || !currentGroup) {
    return null;
  }

  const ctaLabel =
    markerGroups.length > 1 && currentService?.package_name
      ? `${t('customer.openInMaps')} (${currentService.package_name})`
      : t('customer.openInMaps');

  return (
    <Card className="rounded-2xl overflow-hidden border-border/40">
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
          scaleBarEnabled={false}
          onDidFinishLoadingMap={fitMultiMarkerBounds}
          onPress={
            markerGroups.length === 1
              ? () => handleOpenMaps(currentGroup.lat, currentGroup.long, currentService?.package_name)
              : undefined
          }
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: [markerGroups[0].long, markerGroups[0].lat],
              zoomLevel: 14,
            }}
            centerCoordinate={
              markerGroups.length === 1
                ? [markerGroups[0].long, markerGroups[0].lat]
                : undefined
            }
            zoomLevel={markerGroups.length === 1 ? 14 : undefined}
          />

          {markerGroups.map((group) => {
            const activeIndex = activeIndices[group.key] || 0;
            const activeService = group.services[activeIndex];

            return (
              <Mapbox.MarkerView
                key={group.key}
                coordinate={[group.long, group.lat]}
                anchor={{ x: 0.5, y: 0.25 }}
                allowOverlap={true}
                allowOverlapWithPuck={true}
                isSelected={group.key === currentGroup.key}
              >
                <TouchableOpacity
                  onPress={() => handleMarkerPress(group)}
                  activeOpacity={0.7}
                  className="items-center"
                >
                  {/* Pin Container */}
                  <View className="relative pt-1 pr-1">
                    {/* Pin Icon */}
                    <View className="w-8 h-8 items-center justify-center">
                      <Ionicons name="location" size={28} color={colors.primary} />
                    </View>

                    {/* Badge for multiple services */}
                    {group.services.length > 1 && (
                      <View className="absolute top-0 right-0 bg-destructive rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-[10px] text-white font-semibold">
                          {group.services.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Callout */}
                  <View
                    className={`mt-1 bg-card border rounded-lg p-2 ${
                      markerGroups.length > 1
                        ? 'min-w-[140px] max-w-[180px]'
                        : 'min-w-[170px] max-w-[210px]'
                    } shadow-sm ${
                      markerGroups.length > 1 && group.key === currentGroup.key
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                  >
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
                        {t('customer.cycleServiceHint', {
                          current: activeIndex + 1,
                          total: group.services.length,
                        })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Mapbox.MarkerView>
            );
          })}
        </Mapbox.MapView>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          handleOpenMaps(currentGroup.lat, currentGroup.long, currentService?.package_name)
        }
        className="flex-row items-center justify-between px-4 py-3 border-t border-border/60 bg-card"
      >
        <View className="flex-row items-center gap-x-2 flex-1 mr-2">
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text weight="semibold" className="text-xs text-primary" numberOfLines={1}>
            {ctaLabel}
          </Text>
        </View>
        <Ionicons name="open-outline" size={16} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}
