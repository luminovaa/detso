import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/src/components/global/bottom-sheet';
import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { Button } from '@/src/components/global/button';
import { NetworkNode } from '@/src/features/network/types';
import { useDeleteNode } from '@/src/features/network/hooks';
import { useT } from '@/src/features/i18n/store';

interface NodeDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  node: NetworkNode | null;
  onEdit: () => void;
  onConnect: () => void;
  onDismiss: () => void;
}

export function NodeDetailSheet({
  sheetRef,
  node,
  onEdit,
  onConnect,
  onDismiss,
}: NodeDetailSheetProps) {
  const { t } = useT();
  const deleteNode = useDeleteNode();

  if (!node) return null;

  const isServer = node.type === 'SERVER';
  const iconColor = isServer ? '#8b5cf6' : '#3b82f6';
  const typeLabel = isServer ? t('network.nodeDetail.server') : t('network.nodeDetail.odp');

  const handleDelete = () => {
    Alert.alert(
      t('network.nodeDetail.deleteTitle', { type: typeLabel }),
      `${t('network.nodeDetail.deleteMessage', { name: node.name })}${
        isServer
          ? t('network.nodeDetail.deleteWarningServer')
          : t('network.nodeDetail.deleteWarningODP')
      }`,
      [
        { text: t('network.nodeDetail.cancel'), style: 'cancel' },
        {
          text: t('network.nodeDetail.delete'),
          style: 'destructive',
          onPress: () => {
            deleteNode.mutate(node.id, {
              onSuccess: () => {
                sheetRef.current?.dismiss();
              },
            });
          },
        },
      ]
    );
  };

  return (
    <BottomSheet ref={sheetRef} onDismiss={onDismiss}>
      <BottomSheetHeader>
        {/* Type badge + Name */}
        <View className="flex-row items-center gap-2 mb-1">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: iconColor }}
          >
            <Ionicons
              name={isServer ? 'server' : 'cube'}
              size={16}
              color="white"
            />
          </View>
          <View className="flex-1">
            <BottomSheetTitle className="text-left">{node.name}</BottomSheetTitle>
            <Badge variant="outline" className="self-start mt-0.5">
              {typeLabel}
            </Badge>
          </View>
        </View>
      </BottomSheetHeader>

      {/* Info rows */}
      <View className="gap-3 mb-4">
        {node.address && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-muted-foreground flex-1">{node.address}</Text>
          </View>
        )}

        {node.type === 'ODP' && node.slot && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="git-branch-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-muted-foreground">
              {t('network.nodeDetail.slotUsed', { used: node.used_slot, total: node.slot })}
            </Text>
          </View>
        )}

        {node.type === 'ODP' && node.parent_name && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="server-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-muted-foreground">
              {t('network.nodeDetail.parent', { name: node.parent_name })}
            </Text>
          </View>
        )}

        {node.type === 'SERVER' && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="cube-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-muted-foreground">
              {t('network.nodeDetail.odpConnected', { count: node.children_count })}
            </Text>
          </View>
        )}

        {node.notes && (
          <View className="flex-row items-start gap-2">
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-muted-foreground flex-1">{node.notes}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onEdit}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="pencil" size={14} color="#6b7280" />
            <Text className="text-sm">{t('network.nodeDetail.edit')}</Text>
          </View>
        </Button>

        {node.type === 'ODP' && (
          <Button variant="outline" className="flex-1" onPress={onConnect}>
            <View className="flex-row items-center gap-1">
              <Ionicons name="link" size={14} color="#3b82f6" />
              <Text className="text-sm text-blue-500">{t('network.nodeDetail.connect')}</Text>
            </View>
          </Button>
        )}

        <Button variant="destructive" className="flex-1" onPress={handleDelete}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="trash" size={14} color="white" />
            <Text className="text-sm text-white">{t('network.nodeDetail.remove')}</Text>
          </View>
        </Button>
      </View>
    </BottomSheet>
  );
}
