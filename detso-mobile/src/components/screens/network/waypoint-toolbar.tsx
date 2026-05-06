/**
 * WAYPOINT TOOLBAR
 *
 * Floating panel shown during waypoint editing mode.
 * Styled like a bottom-sheet but NOT a BottomSheetModal (so map interaction stays active).
 * Positioned above the tab bar using fabBottom.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../global/text';
import { Button } from '../../global/button';
import { useNetworkMapStore } from '@/src/features/network/store';
import { useEditLink } from '@/src/features/network/hooks';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';

export function WaypointToolbar() {
  const colors = useThemeColor();
  const { t } = useT();
  const { fabBottom } = useTabBarHeight();
  const {
    mode,
    editingLinkId,
    draftWaypoints,
    resetWaypoints,
    removeWaypoint,
    cancelEditWaypoints,
  } = useNetworkMapStore();

  const editLink = useEditLink();
  const isSaving = editLink.isPending;

  if (mode !== 'edit_waypoints' || !editingLinkId) return null;

  const handleSave = () => {
    // Convert from Mapbox [lng, lat] to storage [lat, lng]
    const waypointsForApi = draftWaypoints.length > 0
      ? draftWaypoints.map(([lng, lat]) => [lat, lng])
      : null;

    editLink.mutate(
      { id: editingLinkId, data: { waypoints: waypointsForApi } },
      { onSuccess: () => cancelEditWaypoints() }
    );
  };

  const handleRemoveLast = () => {
    if (draftWaypoints.length > 0) {
      removeWaypoint(draftWaypoints.length - 1);
    }
  };

  return (
    <View
      className="absolute left-3 right-3 bg-card rounded-[20px] px-4 pt-2 pb-4 border border-border/50"
      style={{ bottom: fabBottom, shadowColor: colors.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 }}
    >
      {/* Handle indicator (like bottom sheet) */}
      <View className="w-9 h-1 rounded-full bg-muted self-center mb-2.5" />

      {/* Info banner */}
      <View className="flex-row items-center bg-muted/50 rounded-lg px-2.5 py-2 mb-2.5 border border-border">
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text className="text-xs text-muted-foreground ml-1.5 flex-1">
          {t('network.waypoint.hint')}
        </Text>
      </View>

      {/* Waypoint count + remove last */}
      {draftWaypoints.length > 0 && (
        <View className="flex-row items-center justify-between mb-2.5 px-1">
          <Text weight="medium" className="text-xs text-muted-foreground">
            {draftWaypoints.length} titik
          </Text>
          <TouchableOpacity
            className="flex-row items-center py-1 px-2 rounded-md bg-destructive/10 border border-destructive/20"
            onPress={handleRemoveLast}
            disabled={isSaving}
          >
            <Ionicons name="backspace-outline" size={14} color={colors.error} />
            <Text className="text-xs text-destructive ml-1">Hapus terakhir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-x-2.5">
        {/* Cancel */}
        <Button
          variant="outline"
          size="lg"
          leftIcon={<Ionicons name="close" size={18} color={colors.icon} />}
          title={t('common.cancel')}
          onPress={cancelEditWaypoints}
          disabled={isSaving}
          className="flex-1"
        />

        {/* Reset */}
        <Button
          variant="secondary"
          size="lg"
          leftIcon={<Ionicons name="refresh" size={18} color={colors.white} />}
          title="Reset"
          onPress={resetWaypoints}
          disabled={isSaving}
          className="flex-1"
        />

        {/* Save */}
        <Button
          variant="primary"
          size="lg"
          leftIcon={!isSaving ? <Ionicons name="checkmark" size={18} color={colors.white} /> : undefined}
          title={t('common.save')}
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          className="flex-1"
        />
      </View>
    </View>
  );
}
