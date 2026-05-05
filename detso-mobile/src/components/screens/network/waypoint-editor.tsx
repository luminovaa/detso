/**
 * WAYPOINT EDITOR
 *
 * Renders the draft polyline and static waypoint markers during edit mode.
 * Interaction model: TAP on map to add waypoints (handled by parent map.tsx).
 * This component only renders the visual feedback:
 * - Draft polyline (yellow line showing the edited path)
 * - Numbered waypoint markers (static, showing order)
 * - Start/end endpoint indicators (green/red)
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Text } from '../../global/text';
import { useNetworkMapStore } from '@/src/features/network/store';
import { NetworkTopology } from '@/src/features/network/types';
import { toMapboxCoord } from '@/src/lib/map-utils';

interface WaypointEditorProps {
  topology: NetworkTopology;
}

export function WaypointEditor({ topology }: WaypointEditorProps) {
  const { editingLinkId, draftWaypoints } = useNetworkMapStore();

  // Get the link being edited
  const editingLink = useMemo(() => {
    if (!editingLinkId) return null;
    return topology.links.find((l) => l.id === editingLinkId) || null;
  }, [editingLinkId, topology.links]);

  // Get start and end coordinates of the link
  const endpoints = useMemo(() => {
    if (!editingLink) return null;

    const fromNode = topology.nodes.find((n) => n.id === editingLink.from_node_id);
    if (!fromNode) return null;
    const fromCoord = toMapboxCoord(fromNode.lat, fromNode.long);
    if (!fromCoord) return null;

    let toCoord: [number, number] | null = null;
    if (editingLink.to_node_id) {
      const toNode = topology.nodes.find((n) => n.id === editingLink.to_node_id);
      if (toNode) toCoord = toMapboxCoord(toNode.lat, toNode.long);
    } else if (editingLink.to_service_id) {
      const toService = topology.services.find((s) => s.id === editingLink.to_service_id);
      if (toService) toCoord = toMapboxCoord(toService.lat, toService.long);
    }

    if (!toCoord) return null;
    return { from: fromCoord, to: toCoord };
  }, [editingLink, topology.nodes, topology.services]);

  // Build the full path: [from] + draftWaypoints + [to]
  const fullPath = useMemo(() => {
    if (!endpoints) return [];
    return [endpoints.from, ...draftWaypoints, endpoints.to];
  }, [endpoints, draftWaypoints]);

  // Draft line GeoJSON for the edited path
  const draftLineGeoJSON = useMemo(() => {
    if (fullPath.length < 2) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: fullPath,
          },
          properties: {},
        },
      ],
    };
  }, [fullPath]);

  if (!editingLinkId || !endpoints) return null;

  return (
    <>
      {/* Draft polyline (the edited path) — rendered first so markers appear on top */}
      {draftLineGeoJSON && (
        <Mapbox.ShapeSource id="draft-line-source" shape={draftLineGeoJSON as any}>
          <Mapbox.LineLayer
            id="draft-line"
            style={{
              lineColor: '#f59e0b',
              lineWidth: 4,
              lineOpacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>
      )}

      {/* Waypoint markers (small dots on top of the line) */}
      {draftWaypoints.map((coord, index) => (
        <Mapbox.PointAnnotation
          key={`wp-${index}`}
          id={`waypoint-${index}`}
          coordinate={coord}
          anchor={{ x: 0.5, y: 0.5 }}
          onSelected={() => {}}
        >
          <View
            collapsable={false}
            style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#f59e0b', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4 }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' }} />
          </View>
        </Mapbox.PointAnnotation>
      ))}

      {/* Start endpoint indicator (green) */}
      <Mapbox.PointAnnotation
        id="endpoint-start"
        coordinate={endpoints.from}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View
          collapsable={false}
          style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#10b981', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 2, elevation: 3 }}
        >
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981' }} />
        </View>
      </Mapbox.PointAnnotation>

      {/* End endpoint indicator (red) */}
      <Mapbox.PointAnnotation
        id="endpoint-end"
        coordinate={endpoints.to}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View
          collapsable={false}
          style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#ef4444', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 2, elevation: 3 }}
        >
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' }} />
        </View>
      </Mapbox.PointAnnotation>
    </>
  );
}
