import React, { useCallback, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ImageViewerImage {
  uri: string;
  label?: string;
}

interface ImageViewerProps {
  visible: boolean;
  images: ImageViewerImage[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when modal opens with a new initialIndex
  React.useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  if (!currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View className="flex-1 bg-black">
        {/* Header */}
        <View
          className="absolute top-0 left-0 right-0 z-20 flex-row items-center justify-between px-4"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {hasMultiple && (
            <View className="bg-black/50 rounded-full px-3 py-1">
              <Text className="text-white text-sm">
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Spacer for alignment */}
          <View className="w-10" />
        </View>

        {/* Image */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: currentImage.uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>

        {/* Label */}
        {currentImage.label && (
          <View className="absolute bottom-0 left-0 right-0 items-center pb-4" style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="bg-black/50 rounded-full px-4 py-2">
              <Text className="text-white text-sm">{currentImage.label}</Text>
            </View>
          </View>
        )}

        {/* Navigation Arrows */}
        {hasMultiple && currentIndex > 0 && (
          <TouchableOpacity
            onPress={goPrev}
            className="absolute left-3 top-1/2 -mt-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {hasMultiple && currentIndex < images.length - 1 && (
          <TouchableOpacity
            onPress={goNext}
            className="absolute right-3 top-1/2 -mt-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}
