import React, { useCallback } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Text } from '@/src/components/global/text';
import { Button } from '@/src/components/global/button';
import { useT } from '@/src/features/i18n/store';
import { Schedule } from '@/src/lib/types';
import { COLORS } from '@/src/lib/colors';

interface CompleteScheduleSectionProps {
  schedule: Schedule;
  photo: string | null;
  setPhoto: (uri: string | null) => void;
  notes: string;
  setNotes: (text: string) => void;
  onComplete: () => void;
  isLoading: boolean;
}

export function CompleteScheduleSection({
  schedule,
  photo,
  setPhoto,
  notes,
  setNotes,
  onComplete,
  isLoading,
}: CompleteScheduleSectionProps) {
  const { t } = useT();
  const hasTicket = !!schedule.ticket_id;

  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, [setPhoto]);

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, [setPhoto]);

  return (
    <View className="px-4 py-4 border-t border-border">
      <Text className="text-sm font-semibold mb-3">
        {t('schedule.completeTitle')}
      </Text>

      {/* Photo Upload */}
      <View className="mb-4">
        <Text className="text-sm text-muted-foreground mb-2">
          {t('schedule.completePhotoLabel')}
          {hasTicket && <Text className="text-destructive"> *</Text>}
        </Text>

        {/* Photo Preview (if uploaded) */}
        {photo ? (
          <View className="relative">
            <Image
              source={{ uri: photo }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            {/* Remove Photo Button */}
            <TouchableOpacity
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
              onPress={() => setPhoto(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          /* Upload Buttons */
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onPress={handleTakePhoto}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="camera" size={16} color={COLORS.brand.primary} />
                <Text className="text-primary text-sm">{t('schedule.takePhoto')}</Text>
              </View>
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onPress={handlePickPhoto}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="images" size={16} color={COLORS.brand.primary} />
                <Text className="text-primary text-sm">{t('schedule.pickPhoto')}</Text>
              </View>
            </Button>
          </View>
        )}
      </View>

      {/* Notes Input */}
      <View className="mb-4">
        <Text className="text-sm text-muted-foreground mb-2">
          {t('schedule.completeNotesLabel')}
        </Text>
        <BottomSheetTextInput
          className="border border-border rounded-lg p-3 text-foreground min-h-[80px]"
          placeholder={t('schedule.completeNotesPlaceholder')}
          placeholderTextColor={COLORS.neutral.gray[400]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: "top" }}
        />
      </View>

      {/* Complete Button */}
      <Button
        onPress={onComplete}
        disabled={hasTicket && !photo}
        isLoading={isLoading}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={16} color="white" />
          <Text className="text-white font-semibold">
            {hasTicket 
              ? t('schedule.completeBtnWithTicket')
              : t('schedule.completeBtn')
            }
          </Text>
        </View>
      </Button>

      {/* Helper Text */}
      {hasTicket && !photo && (
        <Text className="text-xs text-muted-foreground mt-2 text-center">
          {t('schedule.photoRequired')}
        </Text>
      )}
    </View>
  );
}
