import { NetworkTopology, NetworkNode, NetworkService } from '@/src/features/network/types';

/**
 * Convert lat/lng strings to Mapbox coordinate [lng, lat].
 * Mapbox uses [longitude, latitude] order.
 */
export function toMapboxCoord(lat: string | null, long: string | null): [number, number] | null {
  if (!lat || !long) return null;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(long);
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  return [lngNum, latNum];
}

/**
 * Calculate midpoint between two coordinates.
 * Used for waypoint editing (midpoint handles).
 */
export function getMidpoint(
  p1: [number, number],
  p2: [number, number]
): [number, number] {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

/**
 * Calculate center coordinate from an array of points.
 * Returns null if no valid points.
 */
export function getCenter(points: [number, number][]): [number, number] | null {
  if (points.length === 0) return null;
  const sumLng = points.reduce((acc, p) => acc + p[0], 0);
  const sumLat = points.reduce((acc, p) => acc + p[1], 0);
  return [sumLng / points.length, sumLat / points.length];
}

/**
 * Calculate zoom level based on bounding box of points.
 */
export function getZoomForPoints(points: [number, number][]): number {
  if (points.length === 0) return 12;
  if (points.length === 1) return 15;

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const maxSpan = Math.max(lngSpan, latSpan);

  if (maxSpan < 0.005) return 16;
  if (maxSpan < 0.01) return 15;
  if (maxSpan < 0.05) return 13;
  if (maxSpan < 0.1) return 12;
  if (maxSpan < 0.5) return 10;
  return 8;
}

/**
 * Build line coordinates for a link.
 * Uses waypoints if available, otherwise straight line from→to.
 */
export function getLinkCoordinates(
  link: { from_node_id: string; to_node_id: string | null; to_service_id: string | null; waypoints: number[][] | null },
  topology: NetworkTopology
): [number, number][] | null {
  // Find "from" coordinate
  const fromNode = topology.nodes.find((n) => n.id === link.from_node_id);
  if (!fromNode) return null;
  const fromCoord = toMapboxCoord(fromNode.lat, fromNode.long);
  if (!fromCoord) return null;

  // Find "to" coordinate
  let toCoord: [number, number] | null = null;

  if (link.to_node_id) {
    const toNode = topology.nodes.find((n) => n.id === link.to_node_id);
    if (toNode) toCoord = toMapboxCoord(toNode.lat, toNode.long);
  } else if (link.to_service_id) {
    const toService = topology.services.find((s) => s.id === link.to_service_id);
    if (toService) toCoord = toMapboxCoord(toService.lat, toService.long);
  }

  if (!toCoord) return null;

  // If waypoints exist, use them (convert from [lat, lng] to [lng, lat])
  if (link.waypoints && link.waypoints.length > 0) {
    return link.waypoints.map(([lat, lng]) => [lng, lat] as [number, number]);
  }

  // Otherwise straight line
  return [fromCoord, toCoord];
}

/**
 * Build GeoJSON FeatureCollection for nodes.
 */
export function buildNodesGeoJSON(nodes: NetworkNode[]) {
  const features = nodes
    .map((node) => {
      const coord = toMapboxCoord(node.lat, node.long);
      if (!coord) return null;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coord },
        properties: {
          id: node.id,
          type: node.type,
          name: node.name,
          slot: node.slot,
          used_slot: node.used_slot,
          children_count: node.children_count,
        },
      };
    })
    .filter(Boolean);

  return { type: 'FeatureCollection' as const, features };
}

/**
 * Build GeoJSON FeatureCollection for services (ONT/Customer).
 */
export function buildServicesGeoJSON(services: NetworkService[]) {
  const features = services
    .map((svc) => {
      const coord = toMapboxCoord(svc.lat, svc.long);
      if (!coord) return null;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coord },
        properties: {
          id: svc.id,
          name: svc.customer_name,
          status: svc.status,
          package_name: svc.package_name,
        },
      };
    })
    .filter(Boolean);

  return { type: 'FeatureCollection' as const, features };
}

/**
 * Build GeoJSON FeatureCollection for links (polylines).
 */
export function buildLinksGeoJSON(topology: NetworkTopology) {
  const features = topology.links
    .map((link) => {
      const coordinates = getLinkCoordinates(link, topology);
      if (!coordinates || coordinates.length < 2) return null;
      return {
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates },
        properties: {
          id: link.id,
          type: link.type,
          from_node_id: link.from_node_id,
          to_node_id: link.to_node_id,
          to_service_id: link.to_service_id,
        },
      };
    })
    .filter(Boolean);

  return { type: 'FeatureCollection' as const, features };
}

/**
 * Get all renderable coordinates from topology (for auto-centering).
 */
export function getAllCoordinates(topology: NetworkTopology): [number, number][] {
  const coords: [number, number][] = [];

  topology.nodes.forEach((node) => {
    const coord = toMapboxCoord(node.lat, node.long);
    if (coord) coords.push(coord);
  });

  topology.services.forEach((svc) => {
    const coord = toMapboxCoord(svc.lat, svc.long);
    if (coord) coords.push(coord);
  });

  return coords;
}
