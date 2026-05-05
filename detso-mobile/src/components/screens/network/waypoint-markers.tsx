import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { NetworkTopology } from '@/src/features/network/types';
import { useNetworkMapStore } from '@/src/features/network/store';
import { toMapboxCoord, getMidpoint } from '@/src/lib/map-utils';
import { showToast } from '@/src/components/global/toast';
import { useT } from '@/src/features/i18n/store';

interface WaypointMarkersProps {
  topology: NetworkTopology;
}

export function WaypointMarkers({ topology }: WaypointMarkersProps) {
  const { t } = useT();
  const { selectedLinkId, editingWaypoints, insertWaypoint, removeWaypoint } = useNetworkMapStore();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Find selected link
  const selectedLink = useMemo(() => {
    if (!selectedLinkId) return null;
    return topology.links.find((l) => l.id === selectedLinkId);
  }, [selectedLinkId, topology.links]);

  // Get line endpoints
  const endpoints = useMemo(() => {
    if (!selectedLink) return null;

    const fromNode = topology.nodes.find((n) => n.id === selectedLink.from_node_id);
    if (!fromNode) return null;
    const fromCoord = toMapboxCoord(fromNode.lat, fromNode.long);
    if (!fromCoord) return null;

    let toCoord: [number, number] | null = null;

    if (selectedLink.to_node_id) {
      const toNode = topology.nodes.find((n) => n.id === selectedLink.to_node_id);
      if (toNode) toCoord = toMapboxCoord(toNode.lat, toNode.long);
    } else if (selectedLink.to_service_id) {
      const toService = topology.services.find((s) => s.id === selectedLink.to_service_id);
      if (toService) toCoord = toMapboxCoord(toService.lat, toService.long);
    }

    if (!toCoord) return null;

    return { from: fromCoord, to: toCoord };
  }, [selectedLink, topology]);

  // Build full path with waypoints
  const fullPath = useMemo(() => {
    if (!endpoints) return [];
    
    const path: [number, number][] = [endpoints.from];
    
    if (editingWaypoints && editingWaypoints.length > 0) {
      // Convert waypoints from [lat, lng] to [lng, lat] for Mapbox
      editingWaypoints.forEach(([lat, lng]) => {
        path.push([lng, lat]);
      });
    }
    
    path.push(endpoints.to);
    return path;
  }, [endpoints, editingWaypoints]);

  // Calculate midpoints for adding waypoints
  const midpoints = useMemo(() => {
    if (fullPath.length < 2) return [];
    
    const mids: Array<{ coord: [number, number]; insertIndex: number }> = [];
    
    for (let i = 0; i < fullPath.length - 1; i++) {
      const mid = getMidpoint(fullPath[i], fullPath[i + 1]);
      mids.push({ coord: mid, insertIndex: i });
    }
    
    return mids;
  }, [fullPath]);

  const handleMidpointPress = (insertIndex: number, coordinate: [number, number]) => {
    if (editingWaypoints && editingWaypoints.length >= 20) {
      showToast.error(t('common.error'), t('network.maxWaypointsReached'));
      return;
    }
    
    // Convert from Mapbox [lng, lat] to backend [lat, lng]
    insertWaypoint(insertIndex, [coordinate[1], coordinate[0]]);
    showToast.success(t('common.success'), t('network.waypointAdded'));
  };

  const handleWaypointLongPress = (index: number) => {
    removeWaypoint(index);
    showToast.success(t('common.success'), t('network.waypointDeleted'));
  };

  if (!selectedLink || !endpoints || !editingWaypoints) return null;

  return (
    <>
      {/* Existing Waypoints (blue circles with long-press to delete) */}
      {editingWaypoints.map((waypoint, index) => {
        const [lat, lng] = waypoint;
        return (
          <Mapbox.MarkerView
            key={`waypoint-${index}`}
            id={`waypoint-${index}`}
            coordinate={[lng, lat]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
          >
            <TouchableOpacity
              onLongPress={() => handleWaypointLongPress(index)}
              delayLongPress={500}
              activeOpacity={0.7}
              style={[styles.waypointMarker, draggingIndex === index && styles.dragging]}
            >
              <View style={styles.waypointInner} />
            </TouchableOpacity>
          </Mapbox.MarkerView>
        );
      })}

      {/* Midpoint Handles (gray circles for adding waypoints) */}
      {midpoints.map((mid, index) => (
        <Mapbox.MarkerView
          key={`midpoint-${index}`}
          id={`midpoint-${index}`}
          coordinate={mid.coord}
          anchor={{ x: 0.5, y: 0.5 }}
          allowOverlap
        >
          <TouchableOpacity
            onPress={() => handleMidpointPress(mid.insertIndex, mid.coord)}
            activeOpacity={0.7}
            style={styles.midpointMarker}
          >
            <View style={styles.midpointInner} />
          </TouchableOpacity>
        </Mapbox.MarkerView>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  waypointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6', // blue-500
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragging: {
    opacity: 0.7,
    transform: [{ scale: 1.1 }],
  },
  waypointInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  midpointMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9ca3af', // gray-400
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  midpointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});
