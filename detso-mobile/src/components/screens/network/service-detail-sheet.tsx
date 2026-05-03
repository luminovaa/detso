import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/src/components/global/bottom-sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/global/dialog';
import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Button } from '@/src/components/global/button';
import { NetworkService, NetworkTopology } from '@/src/features/network/types';
import { useDeleteLink } from '@/src/features/network/hooks';
import { useT } from '@/src/features/i18n/store';
import { COLORS } from '@/src/lib/colors';

interface ServiceDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  service: NetworkService | null;
  topology: NetworkTopology | null;
  onDismiss: () => void;
}

export function ServiceDetailSheet({
  sheetRef,
  service,
  topology,
  onDismiss,
}: ServiceDetailSheetProps) {
  const { t } = useT();
  const deleteLink = useDeleteLink();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  if (!service) return null;

  // Find the link connecting this service
  const link = topology?.links.find((l) => l.to_service_id === service.id);
  // Find the ODP this service is connected to
  const connectedNode = link
    ? topology?.nodes.find((n) => n.id === link.from_node_id)
    : null;

  const statusColor =
    service.status === 'ACTIVE'
      ? '#10b981'
      : service.status === 'INACTIVE'
      ? '#ef4444'
      : '#f59e0b';

  const statusLabel =
    service.status === 'ACTIVE'
      ? 'Aktif'
      : service.status === 'INACTIVE'
      ? 'Nonaktif'
      : 'Suspended';

  const confirmDisconnect = () => {
    if (!link) return;
    deleteLink.mutate(link.id, {
      onSuccess: () => {
        setShowDisconnectDialog(false);
        sheetRef.current?.dismiss();
      },
    });
  };

  return (
    <BottomSheet ref={sheetRef} onDismiss={onDismiss}>
      <BottomSheetHeader>
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center">
            <Ionicons name="home" size={16} color={statusColor} />
          </View>
          <View className="flex-1">
            <BottomSheetTitle className="text-left">{service.customer_name}</BottomSheetTitle>
            <Badge
              variant="outline"
              className="self-start mt-0.5"
              style={{ borderColor: statusColor }}
            >
              <Text style={{ color: statusColor }} className="text-xs">
                {statusLabel}
              </Text>
            </Badge>
          </View>
        </View>
      </BottomSheetHeader>

      {/* Info */}
      <View className="gap-2.5 mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-muted-foreground">
            {service.package_name} ({service.package_speed})
          </Text>
        </View>

        {service.address && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-muted-foreground flex-1">{service.address}</Text>
          </View>
        )}

        {connectedNode && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-muted-foreground">
              {t('network.serviceDetail.connectedTo', { name: connectedNode.name })}
            </Text>
          </View>
        )}

        {service.customer_phone && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-muted-foreground">{service.customer_phone}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {link && (
        <Button variant="destructive" onPress={() => setShowDisconnectDialog(true)}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="unlink" size={14} color="white" />
            <Text className="text-sm text-white">Putuskan dari {connectedNode?.name || 'ODP'}</Text>
          </View>
        </Button>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Putuskan Koneksi</DialogTitle>
            <DialogDescription>
              Yakin ingin memutuskan "{service.customer_name}" dari {connectedNode?.name || 'ODP'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setShowDisconnectDialog(false)}>
              <Text className="text-sm">Batal</Text>
            </Button>
            <Button
              variant="destructive"
              onPress={confirmDisconnect}
              disabled={deleteLink.isPending}
            >
              <Text className="text-sm text-white">
                {deleteLink.isPending ? 'Memutuskan...' : 'Putuskan'}
              </Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BottomSheet>
  );
}
