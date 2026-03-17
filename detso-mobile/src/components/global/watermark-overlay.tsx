import React from "react";
import { View, Animated } from "react-native";
import { GeoInfo } from "../../lib/camera-utils";
import { Text } from "./text";

export interface WatermarkOverlayProps {
  overlayRef: React.RefObject<View | null>;
  photoUri: string;
  geo: GeoInfo;
  dimensions: { width: number; height: number };
  onReady: () => void;
}

export function WatermarkOverlay({
  overlayRef,
  photoUri,
  geo,
  dimensions,
  onReady,
}: WatermarkOverlayProps) {
  return (
    <View
      ref={overlayRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: -10,
        backgroundColor: "#000",
      }}
      collapsable={false}
    >
      <Animated.Image
        source={{ uri: photoUri }}
        style={{ width: dimensions.width, height: dimensions.height }}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={() => setTimeout(onReady, 150)}
      />

      <View className="absolute bottom-4 left-4 right-4 z-50">
        <View className="bg-black/60 rounded-xl py-2 px-3 border-l-4 border-primary shadow-md">
          <Text weight="bold" className="text-white text-xs tracking-wider">
            {geo.timestamp}
          </Text>
          <Text weight="medium" className="text-white/80 text-[10px] mt-0.5">
            {geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}
          </Text>
          <Text
            className="text-white text-[10px] leading-snug mt-1"
            numberOfLines={2}
          >
            {geo.address}
          </Text>
        </View>
      </View>
    </View>
  );
}
