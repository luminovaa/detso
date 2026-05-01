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
      filterType: 'ALL',
    }),
}));
