import { create } from 'zustand';
import { MapFilterType, MapMode, NetworkNode, NetworkService } from './types';

interface NetworkMapState {
  // ─── Selection State ─────────────────────────────────────────────
  selectedNode: NetworkNode | null;
  selectedService: NetworkService | null;
  selectedLinkId: string | null;

  // ─── Mode State ──────────────────────────────────────────────────
  mode: MapMode;
  addNodeType: 'SERVER' | 'ODP' | null; // Which type to add
  placedCoordinate: { lat: number; lng: number } | null; // Where user tapped

  // ─── Filter State ────────────────────────────────────────────────
  filterType: MapFilterType;

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

  // Filter
  setFilter: (filter) => set({ filterType: filter }),

  // Reset
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
