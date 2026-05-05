import { create } from 'zustand';
import { MapFilterType, MapMode, NetworkNode, NetworkService } from './types';

export type MapStyleType = 'satellite' | 'streets';

interface NetworkMapState {
  // ─── Selection State ─────────────────────────────────────────────
  selectedNode: NetworkNode | null;
  selectedService: NetworkService | null;
  selectedLinkId: string | null;

  // ─── Mode State ──────────────────────────────────────────────────
  mode: MapMode;
  addNodeType: 'SERVER' | 'ODP' | null;
  placedCoordinate: { lat: number; lng: number } | null;

  // ─── Edit Line State ─────────────────────────────────────────────
  editingWaypoints: number[][] | null;

  // ─── Filter & Style State ────────────────────────────────────────
  filterType: MapFilterType;
  mapStyle: MapStyleType;

  // ─── Actions ─────────────────────────────────────────────────────
  selectNode: (node: NetworkNode | null) => void;
  selectService: (service: NetworkService | null) => void;
  selectLink: (linkId: string | null) => void;
  clearSelection: () => void;

  setMode: (mode: MapMode) => void;
  startAddNode: (type: 'SERVER' | 'ODP') => void;
  placeNode: (lat: number, lng: number) => void;
  cancelAdd: () => void;

  // Edit line actions
  startEditLine: (linkId: string, waypoints: number[][] | null) => void;
  updateWaypoint: (index: number, coord: [number, number]) => void;
  insertWaypoint: (index: number, coord: [number, number]) => void;
  removeWaypoint: (index: number) => void;
  cancelEditLine: () => void;

  setFilter: (filter: MapFilterType) => void;
  toggleMapStyle: () => void;
  reset: () => void;
}

export const useNetworkMapStore = create<NetworkMapState>((set) => ({
  // Initial state
  selectedNode: null,
  selectedService: null,
  selectedLinkId: null,
  mode: 'view',
  addNodeType: null,
  placedCoordinate: null,
  editingWaypoints: null,
  filterType: 'ALL',
  mapStyle: 'satellite',

  // Selection
  selectNode: (node) =>
    set({ selectedNode: node, selectedService: null, selectedLinkId: null }),
  selectService: (service) =>
    set({ selectedService: service, selectedNode: null, selectedLinkId: null }),
  selectLink: (linkId) =>
    set({ selectedLinkId: linkId, selectedNode: null, selectedService: null }),
  clearSelection: () =>
    set({ selectedNode: null, selectedService: null, selectedLinkId: null }),

  // Mode
  setMode: (mode) => set({ mode }),
  startAddNode: (type) =>
    set({ mode: 'add_node', addNodeType: type, placedCoordinate: null, selectedNode: null, selectedService: null }),
  placeNode: (lat, lng) =>
    set({ placedCoordinate: { lat, lng } }),
  cancelAdd: () =>
    set({ mode: 'view', addNodeType: null, placedCoordinate: null }),

  // Edit line
  startEditLine: (linkId, waypoints) =>
    set({ 
      mode: 'edit_line', 
      selectedLinkId: linkId, 
      editingWaypoints: waypoints ? [...waypoints] : null,
      selectedNode: null,
      selectedService: null,
    }),
  updateWaypoint: (index, coord) =>
    set((state) => {
      if (!state.editingWaypoints) return state;
      const updated = [...state.editingWaypoints];
      updated[index] = coord;
      return { editingWaypoints: updated };
    }),
  insertWaypoint: (index, coord) =>
    set((state) => {
      const waypoints = state.editingWaypoints || [];
      if (waypoints.length >= 20) return state; // Max 20 waypoints
      const updated = [...waypoints];
      updated.splice(index, 0, coord);
      return { editingWaypoints: updated };
    }),
  removeWaypoint: (index) =>
    set((state) => {
      if (!state.editingWaypoints) return state;
      const updated = [...state.editingWaypoints];
      updated.splice(index, 1);
      return { editingWaypoints: updated };
    }),
  cancelEditLine: () =>
    set({ mode: 'view', selectedLinkId: null, editingWaypoints: null }),

  // Filter & Style
  setFilter: (filter) => set({ filterType: filter }),
  toggleMapStyle: () =>
    set((state) => ({ mapStyle: state.mapStyle === 'satellite' ? 'streets' : 'satellite' })),

  // Reset (mapStyle intentionally NOT reset - user preference persists)
  reset: () =>
    set({
      selectedNode: null,
      selectedService: null,
      selectedLinkId: null,
      mode: 'view',
      addNodeType: null,
      placedCoordinate: null,
      editingWaypoints: null,
      filterType: 'ALL',
    }),
}));
