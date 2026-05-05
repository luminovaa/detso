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

  // ─── Waypoint Editing State ──────────────────────────────────────
  editingLinkId: string | null;
  draftWaypoints: [number, number][]; // [[lng, lat], ...] in Mapbox order

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

  // Waypoint editing actions
  startEditWaypoints: (linkId: string, currentWaypoints: [number, number][]) => void;
  updateWaypoint: (index: number, coord: [number, number]) => void;
  addWaypoint: (index: number, coord: [number, number]) => void;
  removeWaypoint: (index: number) => void;
  resetWaypoints: () => void;
  cancelEditWaypoints: () => void;

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
  editingLinkId: null,
  draftWaypoints: [],
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

  // Waypoint editing
  startEditWaypoints: (linkId, currentWaypoints) =>
    set({
      mode: 'edit_waypoints',
      editingLinkId: linkId,
      draftWaypoints: currentWaypoints,
      selectedNode: null,
      selectedService: null,
      selectedLinkId: null,
    }),
  updateWaypoint: (index, coord) =>
    set((state) => {
      const updated = [...state.draftWaypoints];
      updated[index] = coord;
      return { draftWaypoints: updated };
    }),
  addWaypoint: (index, coord) =>
    set((state) => {
      const updated = [...state.draftWaypoints];
      updated.splice(index, 0, coord);
      return { draftWaypoints: updated };
    }),
  removeWaypoint: (index) =>
    set((state) => {
      const updated = [...state.draftWaypoints];
      updated.splice(index, 1);
      return { draftWaypoints: updated };
    }),
  resetWaypoints: () =>
    set({ draftWaypoints: [] }),
  cancelEditWaypoints: () =>
    set({ mode: 'view', editingLinkId: null, draftWaypoints: [] }),

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
      editingLinkId: null,
      draftWaypoints: [],
      filterType: 'ALL',
    }),
}));
