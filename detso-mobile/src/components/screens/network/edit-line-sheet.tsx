import React, { useMemo } from 'react';
import { View, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../global/text';
import { Button } from '../../global/button';
import { Badge } from '../../global/badge';
import { NetworkTopology } from '@/src/features/network/types';
import { useNetworkMapStore } from '@/src/features/network/store';
import { useEditLink, useDeleteLink } from '@/src/features/network/hooks';
import { useT } from '@/src/features/i18n/store';
import { COLORS } from '@/src/lib/colors';

interface EditLineSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>;
  topology: NetworkTopology;
}

export function EditLineSheet({ sheetRef, topology }: EditLineSheetProps) {
  const { t } = useT();
  const { selectedLinkId, editingWaypoints, startEditLine, cancelEditLine } = useNetworkMapStore();
  const editLink = useEditLink();
  const deleteLink = useDeleteLink();

  // Find selected link
  const selectedLink = useMemo(() => {
    if (!selectedLinkId) return null;
    return topology.links.find((l) => l.id === selectedLinkId);
  }, [selectedLinkId, topology.links]);

  // Get link endpoints info
  const linkInfo = useMemo(() => {
    if (!selectedLink) return null;

    const fromNode = topology.nodes.find((n) => n.id === selectedLink.from_node_id);
    let toName = '';
    let toType = '';

    if (selectedLink.to_node_id) {
      const toNode = topology.nodes.find((n) => n.id === selectedLink.to_node_id);
      toName = toNode?.name || 'Unknown';
      toType = toNode?.type || '';
    } else if (selectedLink.to_service_id) {
      const toService = topology.services.find((s) => s.id === selectedLink.to_service_id);
      toName = toService?.customer_name || 'Unknown';
      toType = 'ONT';
    }

    return {
      fromName: fromNode?.name || 'Unknown',
      fromType: fromNode?.type || '',
      toName,
      toType,
      linkType: selectedLink.type,
    };
  }, [selectedLink, topology]);

  const handleEditWaypoints = () => {
    if (!selectedLink) return;
    startEditLine(selectedLink.id, selectedLink.waypoints);
    sheetRef.current?.dismiss();
  };

  const handleSaveChanges = () => {
    if (!selectedLinkId || editingWaypoints === null) return;

    // Convert waypoints from [lat, lng] to backend format
    const waypointsToSave = editingWaypoints.length > 0 ? editingWaypoints : null;

    editLink.mutate(
      { id: selectedLinkId, data: { waypoints: waypointsToSave } },
      {
        onSuccess: () => {
          cancelEditLine();
          sheetRef.current?.dismiss();
        },
      }
    );
  };

  const handleCancel = () => {
    cancelEditLine();
    sheetRef.current?.dismiss();
  };

  const handleDelete = () => {
    if (!selectedLinkId) return;

    Alert.alert(
      t('network.deleteLineConfirm'),
      t('network.deleteLineMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('network.deleteLine'),
          style: 'destructive',
          onPress: () => {
            deleteLink.mutate(selectedLinkId, {
              onSuccess: () => {
                cancelEditLine();
                sheetRef.current?.dismiss();
              },
            });
          },
        },
      ]
    );
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  );

  if (!selectedLink || !linkInfo) return null;

  const isEditMode = editingWaypoints !== null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={isEditMode ? ['35%'] : ['40%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#F8FAFC' }}
      handleIndicatorStyle={{ backgroundColor: COLORS.neutral.gray[400] }}
    >
      <BottomSheetView style={{ flex: 1, padding: 16 }}>
        {isEditMode ? (
          // Edit Mode UI
          <View className="flex-1">
            <Text weight="bold" className="text-lg text-foreground mb-3">
              {t('network.editingWaypoints')}
            </Text>

            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <Text className="text-xs text-blue-800 mb-1">
                • {t('network.dragInstruction')}
              </Text>
              <Text className="text-xs text-blue-800 mb-1">
                • {t('network.addInstruction')}
              </Text>
              <Text className="text-xs text-blue-800">
                • {t('network.deleteInstruction')}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-muted-foreground">
                {t('network.waypointCount')}: {editingWaypoints.length} / 20
              </Text>
              {editingWaypoints.length >= 20 && (
                <Badge colorVariant="warning">
                  {t('network.maxReached')}
                </Badge>
              )}
            </View>

            <View className="flex-row gap-x-2 mt-auto">
              <Button
                title={t('common.cancel')}
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={handleCancel}
              />
              <Button
                title={t('network.saveChanges')}
                size="lg"
                className="flex-1"
                onPress={handleSaveChanges}
                isLoading={editLink.isPending}
                disabled={editLink.isPending}
              />
            </View>
          </View>
        ) : (
          // View Mode UI
          <View className="flex-1">
            <Text weight="bold" className="text-lg text-foreground mb-4">
              {t('network.editLine')}
            </Text>

            {/* Link Info Card */}
            <View className="bg-muted/30 rounded-xl p-3 border border-border/30 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-x-2">
                  <Ionicons name="git-branch-outline" size={16} color={COLORS.neutral.gray[600]} />
                  <Text className="text-xs text-muted-foreground">{t('network.from')}</Text>
                </View>
                <Text weight="semibold" className="text-sm text-foreground">
                  {linkInfo.fromName}
                </Text>
              </View>

              <View className="flex-row items-center justify-center my-1">
                <Ionicons name="arrow-down" size={16} color={COLORS.neutral.gray[400]} />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-2">
                  <Ionicons name="git-branch-outline" size={16} color={COLORS.neutral.gray[600]} />
                  <Text className="text-xs text-muted-foreground">{t('network.to')}</Text>
                </View>
                <Text weight="semibold" className="text-sm text-foreground">
                  {linkInfo.toName}
                </Text>
              </View>

              <View className="mt-3 pt-3 border-t border-border/30">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">{t('network.linkType')}</Text>
                  <Badge colorVariant={linkInfo.linkType === 'FIBER' ? 'info' : 'success'}>
                    {linkInfo.linkType}
                  </Badge>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-y-2">
              <Button
                title={t('network.editWaypoints')}
                size="lg"
                leftIcon={<Ionicons name="git-network-outline" size={20} color="white" />}
                onPress={handleEditWaypoints}
              />
              <Button
                title={t('network.deleteLine')}
                variant="outline"
                size="lg"
                leftIcon={<Ionicons name="trash-outline" size={20} color={COLORS.status.error} />}
                onPress={handleDelete}
                className="border-destructive"
              />
            </View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
