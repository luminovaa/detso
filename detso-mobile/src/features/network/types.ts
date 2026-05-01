// ─── Network Node ────────────────────────────────────────────────

export interface NetworkNode {
  id: string;
  type: 'SERVER' | 'ODP';
  name: string;
  lat: string;
  long: string;
  address: string | null;
  slot: number | null;
  notes: string | null;
  parent_id: string | null;
  parent_name?: string | null;
  children_count: number;
  used_slot: number;
  connected_services?: number;
}

// ─── Network Link ────────────────────────────────────────────────

export interface NetworkLink {
  id: string;
  from_node_id: string;
  to_node_id: string | null;
  to_service_id: string | null;
  type: 'FIBER' | 'DROP_CABLE';
  waypoints: number[][] | null; // [[lat, lng], ...]
  notes: string | null;
}

// ─── Network Service (Customer/ONT on map) ───────────────────────

export interface NetworkService {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  package_name: string;
  package_speed: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lat: string | null;
  long: string | null;
  address: string | null;
}

// ─── Topology (combined response) ────────────────────────────────

export interface NetworkTopology {
  nodes: NetworkNode[];
  links: NetworkLink[];
  services: NetworkService[];
}

// ─── Input Types ─────────────────────────────────────────────────

export interface CreateNodeInput {
  type: 'SERVER' | 'ODP';
  name: string;
  lat: string;
  long: string;
  address?: string;
  slot?: number;
  notes?: string;
  parent_id?: string;
}

export interface EditNodeInput {
  name?: string;
  lat?: string;
  long?: string;
  address?: string | null;
  slot?: number | null;
  notes?: string | null;
  parent_id?: string | null;
}

export interface CreateLinkInput {
  from_node_id: string;
  to_node_id?: string;
  to_service_id?: string;
  type: 'FIBER' | 'DROP_CABLE';
  waypoints?: number[][];
  notes?: string;
}

export interface EditLinkInput {
  waypoints?: number[][] | null;
  notes?: string;
  type?: 'FIBER' | 'DROP_CABLE';
}

// ─── Map Interaction State ───────────────────────────────────────

export type MapFilterType = 'ALL' | 'SERVER' | 'ODP' | 'ONT';

export type MapMode = 'view' | 'add_node' | 'connect';
