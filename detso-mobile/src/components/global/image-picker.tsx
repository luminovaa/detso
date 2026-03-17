import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  ImageManipulator,
  SaveFormat,
  ImageResult,
} from "expo-image-manipulator";

import { Portal } from "./portal";
import { CustomCamera } from "./camera";
import { useImagePicker } from "../../hooks/use-image-picker";
import {
  AspectRatio,
  getFileSize,
  calculateCompressionQuality,
} from "../../lib/camera-utils";
import { Text } from "./text";
import { Button } from "./button";
import { BottomSheet } from "./bottom-sheet";

type SheetState =
  | "source-select"
  | "processing"
  | "preview"
  | "picking"
  | "camera";

export interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string, base64?: string) => void;
  quality?: number;
  showPreview?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: AspectRatio;
  enableGeoTag?: boolean;
}

const getNumericRatio = (ratio: AspectRatio) => {
  const map: Record<string, number> = {
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "3:4": 3 / 4,
  };
  return map[ratio] || 4 / 3;
};

export function ImagePickerSheet({
  visible,
  onClose,
  onImageSelected,
  quality = 0.7,
  showPreview = true,
  maxWidth,
  maxHeight,
  aspectRatio = "4:3",
  enableGeoTag,
}: ImagePickerSheetProps) {
  const { pickImage } = useImagePicker();
  const [sheetState, setSheetState] = useState<SheetState>("source-select");
  const [processedResult, setProcessedResult] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible && sheetState === "source-select")
      bottomSheetRef.current?.present();
    else bottomSheetRef.current?.dismiss();
  }, [visible, sheetState]);

  const resetAndClose = useCallback(() => {
    setSheetState("source-select");
    setProcessedResult(null);
    onClose();
  }, [onClose]);

  const processImage = useCallback(
    async (uri: string): Promise<ImageResult | null> => {
      try {
        const initialSize = await getFileSize(uri);
        const dynamicQuality = calculateCompressionQuality(initialSize, 5);
        let manipulator = ImageManipulator.manipulate(uri);
        if (maxWidth || maxHeight)
          manipulator = manipulator.resize({
            width: maxWidth,
            height: maxHeight,
          });
        const imageRef = await manipulator.renderAsync();
        return await imageRef.saveAsync({
          compress: Math.min(quality, dynamicQuality),
          format: SaveFormat.JPEG,
          base64: true,
        });
      } catch (e) {
        return null;
      }
    },
    [quality, maxWidth, maxHeight],
  );

  const handleOpenCamera = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setSheetState("camera");
  }, []);

  const handleCameraCapture = useCallback(
    async (uri: string) => {
      setSheetState("processing");
      const result = await processImage(uri);
      const finalUri = result?.uri ?? uri;
      const finalBase64 = result?.base64;
      if (!showPreview) {
        onImageSelected(finalUri, finalBase64);
        resetAndClose();
        return;
      }
      setProcessedResult({ uri: finalUri, base64: finalBase64 });
      setSheetState("preview");
    },
    [showPreview, onImageSelected, processImage, resetAndClose],
  );

  const handleOpenGallery = useCallback(async () => {
    bottomSheetRef.current?.dismiss();
    setSheetState("picking");
    setTimeout(async () => {
      const asset = await pickImage(false);
      if (!asset) {
        setSheetState("source-select");
        return;
      }
      setSheetState("processing");
      const result = await processImage(asset.uri);
      const finalUri = result?.uri ?? asset.uri;
      const finalBase64 = result?.base64 ?? asset.base64 ?? undefined;
      if (!showPreview) {
        onImageSelected(finalUri, finalBase64);
        resetAndClose();
        return;
      }
      setProcessedResult({ uri: finalUri, base64: finalBase64 });
      setSheetState("preview");
    }, 500); // Beri waktu agar animasi laci tutup selesai dulu
  }, [pickImage, showPreview, onImageSelected, processImage, resetAndClose]);

  const handleConfirm = useCallback(() => {
    if (processedResult) {
      onImageSelected(processedResult.uri, processedResult.base64);
      resetAndClose();
    }
  }, [processedResult, onImageSelected, resetAndClose]);

  //   if (sheetState === "picking") return null;

  return (
    <>
      <CustomCamera
        visible={sheetState === "camera"}
        onClose={() => setSheetState("source-select")}
        onCapture={handleCameraCapture}
        aspectRatio={aspectRatio}
        enableGeoTag={enableGeoTag}
      />

      {visible && (
        <>
          <Portal>
            {/* LAYAR PREVIEW FOTO */}
            {sheetState === "preview" && processedResult && (
              <View className="absolute inset-0 bg-background justify-center px-6 z-[60]">
                <Text
                  weight="bold"
                  className="text-2xl text-foreground text-center mb-6"
                >
                  Konfirmasi Foto
                </Text>
                <View className="bg-card rounded-3xl overflow-hidden border border-border shadow-md mb-8">
                  <Image
                    source={{ uri: processedResult.uri }}
                    style={{
                      width: "100%",
                      aspectRatio: getNumericRatio(aspectRatio),
                    }}
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-row gap-4">
                  <Button
                    title="Ambil Ulang"
                    variant="outline"
                    className="flex-1"
                    onPress={() => setSheetState("source-select")}
                  />
                  <Button
                    title="Gunakan"
                    variant="primary"
                    className="flex-1"
                    onPress={handleConfirm}
                  />
                </View>
              </View>
            )}

            {/* LAYAR PROCESSING */}
            {sheetState === "processing" && (
              <View className="absolute inset-0 bg-background/95 justify-center items-center z-[60]">
                <ActivityIndicator
                  size="large"
                  color="#1d4ed8"
                  className="mb-4"
                />
                <Text weight="bold" className="text-xl text-foreground">
                  Memproses Foto...
                </Text>
                <Text className="text-muted-foreground mt-2">
                  Menyematkan titik koordinat GPS.
                </Text>
              </View>
            )}
          </Portal>

          {/* BOTTOM SHEET PILIHAN SUMBER */}
          <BottomSheet
            ref={bottomSheetRef}
            snapPoints={["35%"]}
            onDismiss={() => {
              if (sheetState === "source-select") resetAndClose();
            }}
          >
            <Text
              weight="bold"
              className="text-xl text-foreground text-center mb-8"
            >
              Pilih Sumber Foto
            </Text>
            <View className="flex-row justify-center gap-8">
              <TouchableOpacity
                onPress={handleOpenCamera}
                activeOpacity={0.7}
                className="items-center"
              >
                <View className="bg-primary/10 h-20 w-20 rounded-2xl items-center justify-center mb-3 border border-primary/20">
                  <Ionicons name="camera" size={32} color="#1d4ed8" />
                </View>
                <Text weight="semibold" className="text-foreground">
                  Kamera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleOpenGallery}
                activeOpacity={0.7}
                className="items-center"
              >
                <View className="bg-muted h-20 w-20 rounded-2xl items-center justify-center mb-3 border border-border">
                  <Ionicons name="images" size={32} color="#64748b" />
                </View>
                <Text weight="semibold" className="text-foreground">
                  Galeri
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheet>
        </>
      )}
    </>
  );
}
