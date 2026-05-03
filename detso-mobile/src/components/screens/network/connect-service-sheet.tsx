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
import { BottomSheetInput } from '@/src/components/global/bottom-sheet-input';
import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { NetworkNode, NetworkTopology } from '@/src/features/network/types';
import { useCreateLink } from '@/src/features/network/hooks';
import { useT } from '@/src/features/i18n/store';

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
  const { t } = useT();
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
    <BottomSheet ref={sheetRef} snapPoints={['85%']} onDismiss={onDismiss} enableScroll={false}>
      <BottomSheetHeader>
        <BottomSheetTitle>{t('network.connectService.title')}</BottomSheetTitle>
        <BottomSheetDescription>
          {t('network.connectService.description', { name: node.name })}
          {node.slot ? ` (${node.used_slot}/${node.slot} slot)` : ''}
        </BottomSheetDescription>
      </BottomSheetHeader>

      {/* Search */}
      <View className="mb-3">
        <BottomSheetInput
          placeholder={t('network.connectService.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Service list */}
      <BottomSheetFlatList
        data={unlinkedServices}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => {
          const customerName = item.customer?.name || item.customer_name || t('network.connectService.unknown');
          const hasLocation = item.lat && item.long;

          return (
            <TouchableOpacity
              onPress={() => handleConnect(item.id)}
              disabled={createLink.isPending}
              className="flex-row items-center py-3 px-2 border-b border-border"
            >
              <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mr-3">
                <Ionicons name="person" size={16} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text weight="medium" className="text-sm text-foreground">
                  {customerName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.package_name || item.package?.name || '-'} • {item.address || t('network.connectService.noAddress')}
                </Text>
              </View>
              {hasLocation ? (
                <Badge variant="outline" className="ml-2">
                  <Ionicons name="location" size={10} color="#10B981" />
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  <Text className="text-[10px]">{t('network.connectService.noGps')}</Text>
                </Badge>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            <Text className="text-muted-foreground mt-2 text-center">
              {search
                ? t('network.connectService.noMatch')
                : t('network.connectService.allConnected')}
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}
