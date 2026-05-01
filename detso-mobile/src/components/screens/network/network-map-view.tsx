import React, { useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { config } from '@/src/lib/config';
import { NetworkTopology, NetworkNode, NetworkService } from '@/src/features/network/types';
import { useNetworkMapStore } from '@/src/features/network/store';
import {
  buildNodesGeoJSON,
  buildServicesGeoJSON,
  buildLinksGeoJSON,
  getAllCoordinates,
  getCenter,
  getZoomForPoints,
} from '@/src/lib/map-utils';

Mapbox.setAccessToken(config.MAPBOX_PUBLIC_TOKEN);

interface NetworkMapViewProps {
  topology: NetworkTopology;
  cameraRef: React.RefObject<Mapbox.Camera>;
  onMapPress: (lat: number, lng: number) => void;
  onNodePress: (node: NetworkNode) => void;
  onServicePress: (service: NetworkService) => void;
}

export function NetworkMapView({
  topology,
  cameraRef,
  onMapPress,
  onNodePress,
  onServicePress,
}: NetworkMapViewProps) {
  const { filterType, mode } = useNetworkMapStore();

  // ─── Filter topology based on current filter ─────────────────────
  const filteredNodes = useMemo(() => {
    if (filterType === 'ALL' || filterType === 'ONT') return topology.nodes;
    return topology.nodes.filter((n) => n.type === filterType);
  }, [topology.nodes, filterType]);

  const filteredServices = useMemo(() => {
    if (filterType === 'ALL' || filterType === 'ONT') return topology.services;
    if (filterType === 'SERVER' || filterType === 'ODP') return [];
    return topology.services;
  }, [topology.services, filterType]);

  const showLines = filterType === 'ALL';

  // ─── Build GeoJSON ───────────────────────────────────────────────
  const nodesGeoJSON = useMemo(() => buildNodesGeoJSON(filteredNodes), [filteredNodes]);
  const servicesGeoJSON = useMemo(() => buildServicesGeoJSON(filteredServices), [filteredServices]);
  const linksGeoJSON = useMemo(() => buildLinksGeoJSON(topology), [topology]);

  // ─── Camera center ───────────────────────────────────────────────
  const allCoords = useMemo(() => getAllCoordinates(topology), [topology]);
  const center = useMemo(() => getCenter(allCoords) || [112.75, -7.25], [allCoords]);
  const zoom = useMemo(() => getZoomForPoints(allCoords), [allCoords]);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleMapPress = useCallback(
    (event: any) => {
      const { geometry } = event;
      if (geometry?.coordinates) {
        const [lng, lat] = geometry.coordinates;
        onMapPress(lat, lng);
      }
    },
    [onMapPress]
  );

  const handleNodePress = useCallback(
    (event: any) => {
      const feature = event?.features?.[0];
      if (feature?.properties?.id) {
        const node = topology.nodes.find((n) => n.id === feature.properties.id);
        if (node) onNodePress(node);
      }
    },
    [topology.nodes, onNodePress]
  );

  const handleServicePress = useCallback(
    (event: any) => {
      const feature = event?.features?.[0];
      if (feature?.properties?.id) {
        const service = topology.services.find((s) => s.id === feature.properties.id);
        if (service) onServicePress(service);
      }
    },
    [topology.services, onServicePress]
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        logoEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        onPress={handleMapPress}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={zoom}
          centerCoordinate={center as [number, number]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* ─── Lines Layer ─────────────────────────────────────────── */}
        {showLines && (
          <Mapbox.ShapeSource id="links-source" shape={linksGeoJSON as any}>
            {/* Fiber lines (orange, thicker) */}
            <Mapbox.LineLayer
              id="fiber-lines"
              filter={['==', ['get', 'type'], 'FIBER']}
              style={{
                lineColor: '#f97316',
                lineWidth: 3,
                lineOpacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Drop cable lines (cyan, thinner) */}
            <Mapbox.LineLayer
              id="drop-lines"
              filter={['==', ['get', 'type'], 'DROP_CABLE']}
              style={{
                lineColor: '#06b6d4',
                lineWidth: 2,
                lineOpacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* ─── Service/ONT Markers ─────────────────────────────────── */}
        {filteredServices.length > 0 && (
          <Mapbox.ShapeSource
            id="services-source"
            shape={servicesGeoJSON as any}
            onPress={handleServicePress}
            hitbox={{ width: 20, height: 20 }}
          >
            {/* Active services (green) */}
            <Mapbox.CircleLayer
              id="services-active"
              filter={['==', ['get', 'status'], 'ACTIVE']}
              style={{
                circleRadius: 6,
                circleColor: '#10b981',
                circleStrokeColor: '#ffffff',
                circleStrokeWidth: 2,
              }}
            />
            {/* Inactive services (red) */}
            <Mapbox.CircleLayer
              id="services-inactive"
              filter={['==', ['get', 'status'], 'INACTIVE']}
              style={{
                circleRadius: 6,
                circleColor: '#ef4444',
                circleStrokeColor: '#ffffff',
                circleStrokeWidth: 2,
              }}
            />
            {/* Suspended services (amber) */}
            <Mapbox.CircleLayer
              id="services-suspended"
              filter={['==', ['get', 'status'], 'SUSPENDED']}
              style={{
                circleRadius: 6,
                circleColor: '#f59e0b',
                circleStrokeColor: '#ffffff',
                circleStrokeWidth: 2,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* ─── Node Markers (Server + ODP) ─────────────────────────── */}
        {filteredNodes.length > 0 && (
          <Mapbox.ShapeSource
            id="nodes-source"
            shape={nodesGeoJSON as any}
            onPress={handleNodePress}
            hitbox={{ width: 30, height: 30 }}
          >
            {/* Server markers (purple, larger) */}
            <Mapbox.CircleLayer
              id="server-markers"
              filter={['==', ['get', 'type'], 'SERVER']}
              style={{
                circleRadius: 12,
                circleColor: '#8b5cf6',
                circleStrokeColor: '#ffffff',
                circleStrokeWidth: 3,
              }}
            />
            {/* ODP markers (blue, medium) */}
            <Mapbox.CircleLayer
              id="odp-markers"
              filter={['==', ['get', 'type'], 'ODP']}
              style={{
                circleRadius: 9,
                circleColor: '#3b82f6',
                circleStrokeColor: '#ffffff',
                circleStrokeWidth: 2.5,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* ─── Node Labels ─────────────────────────────────────────── */}
        {filteredNodes.length > 0 && (
          <Mapbox.ShapeSource id="node-labels-source" shape={nodesGeoJSON as any}>
            <Mapbox.SymbolLayer
              id="node-labels"
              minZoomLevel={13}
              style={{
                textField: ['get', 'name'],
                textSize: 11,
                textColor: '#ffffff',
                textHaloColor: '#000000',
                textHaloWidth: 1,
                textOffset: [0, 1.8],
                textAnchor: 'top',
                textAllowOverlap: false,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* User location puck */}
        <Mapbox.LocationPuck puckBearingEnabled puckBearing="heading" />
      </Mapbox.MapView>
    </View>
  );
}
