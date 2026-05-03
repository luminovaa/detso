// src/components/screens/dashboard/tenant-map-view.tsx
import React, { useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
// NOTE: StyleSheet.absoluteFill tetap dibutuhkan untuk Mapbox.MapView (komponen native)
import { Ionicons } from "@expo/vector-icons";
import Mapbox from "@rnmapbox/maps";


import { Card, CardContent } from "@/src/components/global/card";
import { Text } from "@/src/components/global/text";
import { Badge } from "@/src/components/global/badge";
import { config } from "@/src/lib/config";
import { TenantMapData } from "@/src/features/dashboard/types";
import { useT } from "@/src/features/i18n/store";
import { COLORS } from "@/src/lib/colors";

Mapbox.setAccessToken(config.MAPBOX_PUBLIC_TOKEN);

interface TenantMapViewProps {
  data: TenantMapData[];
  /** Callback untuk disable/enable scroll parent (FlatList) saat map disentuh */
  onMapTouchStart?: () => void;
  onMapTouchEnd?: () => void;
}

export function TenantMapView({ data, onMapTouchStart, onMapTouchEnd }: TenantMapViewProps) {
  const { t } = useT();
  const cameraRef = useRef<Mapbox.Camera>(null);

  // Filter hanya tenant yang punya koordinat valid
  const validTenants = useMemo(
    () => data.filter((tenant) => tenant.lat !== 0 && tenant.long !== 0),
    [data],
  );

  // Default: Jawa Timur (lng, lat)
  const JATIM_CENTER: [number, number] = [112.58, -7.42];
  const JATIM_ZOOM = 8;

  // Hitung center dari semua titik, fallback ke Jawa Timur
  const center = useMemo((): [number, number] => {
    if (validTenants.length === 0) return JATIM_CENTER;
    const avgLng =
      validTenants.reduce((sum, item) => sum + item.long, 0) / validTenants.length;
    const avgLat =
      validTenants.reduce((sum, item) => sum + item.lat, 0) / validTenants.length;
    // Pastikan hasilnya angka valid
    if (isNaN(avgLng) || isNaN(avgLat)) return JATIM_CENTER;
    return [avgLng, avgLat];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTenants]);

  // Zoom level berdasarkan jumlah & sebaran titik
  const zoomLevel = useMemo(() => {
    if (validTenants.length === 0) return JATIM_ZOOM;
    if (validTenants.length === 1) return 12;
    if (validTenants.length <= 5) return 9;
    return JATIM_ZOOM;
  }, [validTenants]);



  if (validTenants.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 items-center">
          <Ionicons name="map-outline" size={48} color={COLORS.neutral.gray[500]} />
          <Text className="text-muted-foreground mt-2 text-center">
            {t("dashboard.mapEmpty")}
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <View className="mt-6 mb-4">
      {/* Section Title */}
      <View className="flex-row items-center justify-between mb-3">
        <Text weight="bold" className="text-xl text-foreground">
          {t("dashboard.mapTitle")}
        </Text>
        <Badge variant="outline">
          {`${validTenants.length} ${t("dashboard.mapPoints")}`}
        </Badge>
      </View>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-2xl">
          <View 
            className="h-[280px] w-full"
            onTouchStart={onMapTouchStart}
            onTouchEnd={onMapTouchEnd}
            onTouchCancel={onMapTouchEnd}
          >
            <Mapbox.MapView
              style={StyleSheet.absoluteFill}
              styleURL="mapbox://styles/mapbox/streets-v12"
              logoEnabled={false}
              scaleBarEnabled={false}
              attributionEnabled={false}
              scrollEnabled={true}
              pitchEnabled={false}
              rotateEnabled={true}
              zoomEnabled={true}
            >
              <Mapbox.Camera
                ref={cameraRef}
                zoomLevel={zoomLevel}
                centerCoordinate={center}
                animationMode="flyTo"
                animationDuration={1000}
              />

              {validTenants.map((tenant) => (
                <Mapbox.PointAnnotation
                  key={tenant.id}
                  id={`tenant-${tenant.id}`}
                  coordinate={[tenant.long, tenant.lat]}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View className="items-center pb-1">
                    <Ionicons
                      name="location-sharp"
                      size={40}
                      color={tenant.is_active ? COLORS.status.success : COLORS.status.error}
                    />
                  </View>
                  <Mapbox.Callout title={tenant.name} />
                </Mapbox.PointAnnotation>
              ))}
            </Mapbox.MapView>

            {/* Legend overlay */}
            <View className="absolute bottom-2.5 left-2.5 flex-row bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
              <View className="flex-row items-center mr-4">
                <Ionicons name="location-sharp" size={16} color={COLORS.status.success} />
                <Text className="text-xs text-primary ml-1">
                  {`${t("dashboard.legendActive")} (${validTenants.filter((item) => item.is_active).length})`}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="location-sharp" size={16} color={COLORS.status.error} />
                <Text className="text-xs text-primary ml-1">
                  {`${t("dashboard.legendInactive")} (${validTenants.filter((item) => !item.is_active).length})`}
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

