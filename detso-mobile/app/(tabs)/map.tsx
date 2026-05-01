import React, { useRef, useCallback, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { Text } from '@/src/components/global/text';
import { Button } from '@/src/components/global/button';
import { NetworkMapView } from '@/src/components/screens/network/network-map-view';
import { MapFilterBar } from '@/src/components/screens/network/map-filter-bar';
import { MapLegend } from '@/src/components/screens/network/map-legend';
import { MapControls, AddNodeBanner } from '@/src/components/screens/network/map-controls';
import { NodeDetailSheet } from '@/src/components/screens/network/node-detail-sheet';
import { ServiceDetailSheet } from '@/src/components/screens/network/service-detail-sheet';
import { AddNodeSheet } from '@/src/components/screens/network/add-node-sheet';
import { ConnectServiceSheet } from '@/src/components/screens/network/connect-service-sheet';

import { useNetworkTopology } from '@/src/features/network/hooks';
import { networkService } from '@/src/features/network/service';
import { useNetworkMapStore } from '@/src/features/network/store';
import { NetworkNode, NetworkService } from '@/src/features/network/types';

export default function NetworkMap() {
  const cameraRef = useRef<Mapbox.Camera>(null);

  // ─── Data ──────────────────────────────────────────────────────
  const { data: topologyResponse, isLoading, isError, refetch } = useNetworkTopology();
  const topology = topologyResponse?.data;

  // ─── Store ─────────────────────────────────────────────────────
  const {
    mode,
    selectedNode,
    selectedService,
    selectNode,
    selectService,
    clearSelection,
    startAddNode,
    placeNode,
    cancelAdd,
  } = useNetworkMapStore();

  // ─── Sheet Refs ────────────────────────────────────────────────
  const nodeDetailRef = useRef<BottomSheetModal | null>(null);
  const serviceDetailRef = useRef<BottomSheetModal | null>(null);
  const addNodeRef = useRef<BottomSheetModal | null>(null);
  const connectServiceRef = useRef<BottomSheetModal | null>(null);

  // ─── Local State ───────────────────────────────────────────────
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [allServices, setAllServices] = useState<any[]>([]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleMapPress = useCallback(
    (lat: number, lng: number) => {
      if (mode === 'add_node') {
        // Place node at tapped location
        placeNode(lat, lng);
        addNodeRef.current?.present();
      } else {
        // Clear selection when tapping empty area
        clearSelection();
      }
    },
    [mode, placeNode, clearSelection]
  );

  const handleNodePress = useCallback(
    (node: NetworkNode) => {
      selectNode(node);
      nodeDetailRef.current?.present();
    },
    [selectNode]
  );

  const handleServicePress = useCallback(
    (service: NetworkService) => {
      selectService(service);
      serviceDetailRef.current?.present();
    },
    [selectService]
  );

  const handleLocateMe = useCallback(
    (lat: number, lng: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 16,
        animationMode: 'flyTo',
        animationDuration: 1000,
      });
    },
    []
  );

  const handleAddNode = useCallback(() => {
    Alert.alert('Tambah Node', 'Pilih tipe node yang ingin ditambahkan:', [
      {
        text: 'Server',
        onPress: () => startAddNode('SERVER'),
      },
      {
        text: 'ODP',
        onPress: () => startAddNode('ODP'),
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  }, [startAddNode]);

  const handleEditNode = useCallback(() => {
    nodeDetailRef.current?.dismiss();
    setEditingNode(selectedNode);
    setTimeout(() => addNodeRef.current?.present(), 300);
  }, [selectedNode]);

  const handleConnectService = useCallback(async () => {
    nodeDetailRef.current?.dismiss();
    // Fetch all services for the connect list
    try {
      const res = await networkService.getUnlinkedServices();
      const services = res?.data?.services || res?.data || [];
      setAllServices(Array.isArray(services) ? services : []);
    } catch {
      setAllServices([]);
    }
    setTimeout(() => connectServiceRef.current?.present(), 300);
  }, []);

  const handleDismissNodeDetail = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDismissServiceDetail = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDismissAddNode = useCallback(() => {
    setEditingNode(null);
    if (mode === 'add_node') cancelAdd();
  }, [mode, cancelAdd]);

  const handleDismissConnect = useCallback(() => {}, []);

  // ─── Loading State ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-muted-foreground mt-3">Memuat peta jaringan...</Text>
      </View>
    );
  }

  // ─── Error State ───────────────────────────────────────────────
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="cloud-offline" size={48} color="#ef4444" />
        <Text weight="bold" className="text-foreground mt-3 text-lg">Gagal Memuat</Text>
        <Text className="text-muted-foreground mt-1 text-center">
          Tidak dapat memuat data jaringan. Periksa koneksi internet Anda.
        </Text>
        <Button className="mt-4" onPress={() => refetch()}>
          <Text className="text-primary-foreground">Coba Lagi</Text>
        </Button>
      </View>
    );
  }

  // ─── Empty State ───────────────────────────────────────────────
  if (topology && topology.nodes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="git-network" size={40} color="#3b82f6" />
        </View>
        <Text weight="bold" className="text-foreground text-xl text-center">
          Peta Jaringan Kosong
        </Text>
        <Text className="text-muted-foreground mt-2 text-center">
          Mulai dengan menambahkan Server pertama Anda, lalu tambahkan ODP dan hubungkan customer.
        </Text>
        <Button className="mt-6" onPress={() => startAddNode('SERVER')}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="add" size={18} color="white" />
            <Text weight="bold" className="text-primary-foreground">Tambah Server Pertama</Text>
          </View>
        </Button>
      </View>
    );
  }

  if (!topology) return null;

  // ─── Main Map View ─────────────────────────────────────────────
  return (
    <View className="flex-1">
      {/* Map */}
      <NetworkMapView
        topology={topology}
        cameraRef={cameraRef as any}
        onMapPress={handleMapPress}
        onNodePress={handleNodePress}
        onServicePress={handleServicePress}
      />

      {/* Overlays */}
      <MapFilterBar />
      <AddNodeBanner />
      <MapLegend />
      <MapControls onLocateMe={handleLocateMe} onAddNode={handleAddNode} />

      {/* Bottom Sheets */}
      <NodeDetailSheet
        sheetRef={nodeDetailRef}
        node={selectedNode}
        onEdit={handleEditNode}
        onConnect={handleConnectService}
        onDismiss={handleDismissNodeDetail}
      />

      <ServiceDetailSheet
        sheetRef={serviceDetailRef}
        service={selectedService}
        topology={topology}
        onDismiss={handleDismissServiceDetail}
      />

      <AddNodeSheet
        sheetRef={addNodeRef}
        editNode={editingNode}
        onDismiss={handleDismissAddNode}
      />

      <ConnectServiceSheet
        sheetRef={connectServiceRef}
        node={selectedNode}
        topology={topology}
        allServices={allServices}
        onDismiss={handleDismissConnect}
      />
    </View>
  );
}
