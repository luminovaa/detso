import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/src/components/global/bottom-sheet';
import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Input } from '@/src/components/global/input';
import { NetworkNode, NetworkTopology } from '@/src/features/network/types';
import { useCreateLink } from '@/src/features/network/hooks';

interface ConnectServiceSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  node: NetworkNode | null;
  topology: NetworkTopology | null;
  allServices: any[];
  onDismiss: () => void;
}

export function ConnectServiceSheet({
  sheetRef,
  node,
  topology,
  allServices,
  onDismiss,
}: ConnectServiceSheetProps) {
  const [search, setSearch] = useState('');
  const createLink = useCreateLink();

  // Get IDs of already-linked services
  const linkedServiceIds = useMemo(() => {
    if (!topology) return new Set<string>();
    return new Set(
      topology.links
        .filter((l) => l.to_service_id)
        .map((l) => l.to_service_id as string)
    );
  }, [topology]);

  // Filter unlinked services
  const unlinkedServices = useMemo(() => {
    return allServices.filter((svc: any) => {
      if (linkedServiceIds.has(svc.id)) return false;
      if (!search) return true;
      const customerName = svc.customer?.name || svc.customer_name || '';
      return customerName.toLowerCase().includes(search.toLowerCase());
    });
  }, [allServices, linkedServiceIds, search]);

  const handleConnect = (serviceId: string) => {
    if (!node) return;

    createLink.mutate(
      {
        from_node_id: node.id,
        to_service_id: serviceId,
        type: 'DROP_CABLE',
      },
      {
        onSuccess: () => {
          sheetRef.current?.dismiss();
          setSearch('');
        },
      }
    );
  };

  if (!node) return null;

  return (
    <BottomSheet ref={sheetRef} snapPoints={['70%']} onDismiss={onDismiss} enableScroll={false}>
      <BottomSheetHeader>
        <BottomSheetTitle>Connect Customer</BottomSheetTitle>
        <BottomSheetDescription>
          Hubungkan customer ke {node.name}
          {node.slot ? ` (${node.used_slot}/${node.slot} slot)` : ''}
        </BottomSheetDescription>
      </BottomSheetHeader>

      {/* Search */}
      <View className="mb-3">
        <Input
          placeholder="Cari customer..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Service list */}
      <BottomSheetFlatList
        data={unlinkedServices}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => {
          const customerName = item.customer?.name || item.customer_name || 'Unknown';
          const hasLocation = item.lat && item.long;

          return (
            <TouchableOpacity
              onPress={() => handleConnect(item.id)}
              disabled={createLink.isPending}
              className="flex-row items-center py-3 px-2 border-b border-border"
            >
              <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mr-3">
                <Ionicons name="person" size={16} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text weight="medium" className="text-sm text-foreground">
                  {customerName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.package_name || item.package?.name || '-'} • {item.address || 'Tanpa alamat'}
                </Text>
              </View>
              {hasLocation ? (
                <Badge variant="outline" className="ml-2">
                  <Ionicons name="location" size={10} color="#10b981" />
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  <Text className="text-[10px]">No GPS</Text>
                </Badge>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Ionicons name="checkmark-circle" size={40} color="#10b981" />
            <Text className="text-muted-foreground mt-2 text-center">
              {search
                ? 'Tidak ada customer yang cocok'
                : 'Semua customer sudah terhubung'}
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}
