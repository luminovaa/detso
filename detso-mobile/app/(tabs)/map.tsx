import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { useNetworkTopology, useCreateNode } from '@/src/features/network/hooks';
import { networkService } from '@/src/features/network/service';
import { useNetworkMapStore } from '@/src/features/network/store';
import { NetworkNode, NetworkService } from '@/src/features/network/types';
import { useAuthStore } from '@/src/features/auth/store';
import { useTenant } from '@/src/features/tenant/hooks';
import { Tenant } from '@/src/lib/types';

export default function NetworkMap() {
  const cameraRef = useRef<Mapbox.Camera>(null);

  // ─── Data ──────────────────────────────────────────────────────
  const { user } = useAuthStore();
  const { data: topologyResponse, isLoading, isError, refetch } = useNetworkTopology();
  const topology = topologyResponse?.data;

  // Fetch tenant data for auto-create first server
  const { data: tenantResponse } = useTenant(user?.tenant_id || '');
  const tenant = tenantResponse?.data as Tenant | undefined;

  // ─── Auto-create first server from tenant location ─────────────
  const createNode = useCreateNode();
  const [autoCreating, setAutoCreating] = useState(false);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);

  useEffect(() => {
    // Only run once when:
    // 1. Topology loaded AND has 0 nodes
    // 2. Tenant loaded AND has lat/long
    // 3. Not already creating or attempted
    if (
      topology &&
      topology.nodes.length === 0 &&
      tenant?.lat &&
      tenant?.long &&
      !autoCreating &&
      !autoCreateAttempted &&
      !createNode.isPending
    ) {
      setAutoCreating(true);
      setAutoCreateAttempted(true);

      createNode.mutate(
        {
          type: 'SERVER',
          name: `Server - ${tenant.name}`,
          lat: tenant.lat,
          long: tenant.long,
          address: tenant.address || undefined,
        },
        {
          onSettled: () => {
            setAutoCreating(false);
          },
        }
      );
    }
  }, [topology, tenant, autoCreating, autoCreateAttempted, createNode.isPending]);

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

  // ─── Auto-creating State ───────────────────────────────────────
  if (autoCreating) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text weight="medium" className="text-foreground mt-3">Menyiapkan peta jaringan...</Text>
        <Text className="text-muted-foreground mt-1 text-sm">
          Membuat server di lokasi {tenant?.name || 'ISP'}
        </Text>
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

  // ─── Empty State (tenant has no lat/long) ──────────────────────
  if (topology && topology.nodes.length === 0) {
    const tenantHasLocation = tenant?.lat && tenant?.long;

    // If tenant has location but auto-create failed or hasn't run yet, show manual option
    if (tenantHasLocation) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-muted-foreground mt-3">Menyiapkan peta jaringan...</Text>
        </View>
      );
    }

    // Tenant has NO location → prompt to set it first
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <View className="w-20 h-20 rounded-full bg-amber-500/10 items-center justify-center mb-4">
          <Ionicons name="location" size={40} color="#f59e0b" />
        </View>
        <Text weight="bold" className="text-foreground text-xl text-center">
          Lokasi ISP Belum Diatur
        </Text>
        <Text className="text-muted-foreground mt-2 text-center">
          Atur lokasi ISP Anda terlebih dahulu untuk memulai peta jaringan. Server pertama akan otomatis dibuat di lokasi tersebut.
        </Text>
        <Button className="mt-6" onPress={() => router.push('/settings/edit-tenant')}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={18} color="white" />
            <Text weight="bold" className="text-primary-foreground">Atur Lokasi ISP</Text>
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
