/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Vibration,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  AppState,
  Alert,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from "react-native-vision-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Location from "expo-location";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portal } from "./portal";
import { cn } from "../../lib/utils";
import { Text } from "./text";
import { WatermarkOverlay } from "./watermark-overlay";
import {
  SCREEN_HEIGHT,
  AspectRatio,
  GeoInfo,
  getViewfinderDimensions,
  reverseGeocode,
  getFileSize,
  calculateCompressionQuality,
  formatTimestamp,
} from "../../lib/camera-utils";
import { PermissionScreen } from "./permission";

export interface CustomCameraProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  aspectRatio?: AspectRatio;
  enableGeoTag?: boolean;
  allowClose?: boolean;
}

export function CustomCamera({
  visible,
  onClose,
  onCapture,
  aspectRatio = "4:3",
  enableGeoTag = false,
  allowClose = true,
}: CustomCameraProps) {
  const { hasPermission: hasCameraPerm, requestPermission: reqCameraPerm } =
    useCameraPermission();
  const [cameraDenied, setCameraDenied] = useState(false); // <--- State untuk pantau penolakan kamera
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [isCapturing, setIsCapturing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [locPerm, setLocPerm] = useState<Location.PermissionResponse | null>(
    null,
  );
  const [isGpsEnabled, setIsGpsEnabled] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [liveGeo, setLiveGeo] = useState<GeoInfo | null>(null);
  const [pendingGeo, setPendingGeo] = useState<GeoInfo | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  const watermarkRef = useRef<View | null>(null);
  const device = useCameraDevice(facing);
  const cameraRef = useRef<Camera>(null);
  const shutterAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const viewfinder = getViewfinderDimensions(aspectRatio);

  const checkPermissionsAndGps = useCallback(async () => {
    if (visible && enableGeoTag) {
      const perm = await Location.getForegroundPermissionsAsync();
      setLocPerm(perm);
      if (perm.status === "granted")
        setIsGpsEnabled(await Location.hasServicesEnabledAsync());
    }
  }, [visible, enableGeoTag]);

  useEffect(() => {
    checkPermissionsAndGps();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermissionsAndGps();
    });
    return () => sub.remove();
  }, [checkPermissionsAndGps]);

  useEffect(() => {
    let isMounted = true;
    let clockInterval: ReturnType<typeof setInterval>;
    const startLiveGeo = async () => {
      if (
        !visible ||
        !enableGeoTag ||
        locPerm?.status !== "granted" ||
        !isGpsEnabled
      ) {
        setLiveGeo(null);
        return;
      }
      try {
        setGeoError(null);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const addr = await reverseGeocode(
          loc.coords.latitude,
          loc.coords.longitude,
        );
        if (isMounted) {
          setLiveGeo({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            address: addr,
            timestamp: formatTimestamp(new Date()),
          });
          clockInterval = setInterval(() => {
            setLiveGeo((prev) =>
              prev ? { ...prev, timestamp: formatTimestamp(new Date()) } : null,
            );
          }, 1000);
        }
      } catch (e) {
        if (isMounted) setGeoError("Mencari sinyal GPS...");
      }
    };
    startLiveGeo();
    return () => {
      isMounted = false;
      if (clockInterval) clearInterval(clockInterval);
    };
  }, [visible, enableGeoTag, locPerm?.status, isGpsEnabled]);

  useEffect(() => {
    if (!visible) {
      setPendingGeo(null);
      setPendingPhotoUri(null);
      setLiveGeo(null);
      setGeoError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !hasCameraPerm) reqCameraPerm();
  }, [visible, hasCameraPerm]);

  const handleRequestCamera = async () => {
    const granted = await reqCameraPerm();
    if (!granted) setCameraDenied(true);
  };

  const handleRequestLocation = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    setLocPerm(res);
    if (res.status === "granted") {
      const services = await Location.hasServicesEnabledAsync();
      setIsGpsEnabled(services);
    }
  };

  const handleBurnWatermark = async () => {
    if (!pendingGeo || !pendingPhotoUri || !watermarkRef.current) return;
    try {
      const snapshotUri = await captureRef(watermarkRef, {
        format: "jpg",
        quality: 0.9,
        width: viewfinder.width,
        height: viewfinder.height,
      });
      const initialSize = await getFileSize(snapshotUri);
      const quality = calculateCompressionQuality(initialSize);
      const result =
        await ImageManipulator.manipulate(snapshotUri).renderAsync();
      const fixed = await result.saveAsync({
        compress: quality,
        format: SaveFormat.JPEG,
      });
      onCapture(fixed.uri);
    } catch (e) {
      onCapture(pendingPhotoUri);
    } finally {
      setPendingGeo(null);
      setPendingPhotoUri(null);
      setIsCapturing(false);
    }
  };

  const animateShutter = useCallback(() => {
    Animated.sequence([
      Animated.timing(shutterAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shutterAnim, flashAnim]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    if (enableGeoTag && !liveGeo) return;
    setIsCapturing(true);
    setGeoError(null);
    Vibration.vibrate(40);
    animateShutter();
    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash,
        enableShutterSound: false,
      });
      const uri = `file://${photo.path}`;
      if (!enableGeoTag) {
        const initialSize = await getFileSize(uri);
        const quality = calculateCompressionQuality(initialSize);
        const result = await ImageManipulator.manipulate(uri).renderAsync();
        const fixed = await result.saveAsync({
          compress: quality,
          format: SaveFormat.JPEG,
        });
        onCapture(fixed.uri);
        setIsCapturing(false);
        return;
      }
      setPendingPhotoUri(uri);
      setPendingGeo(liveGeo);
    } catch (e) {
      setGeoError("Gagal mengambil foto.");
      setIsCapturing(false);
    }
  }, [isCapturing, flash, enableGeoTag, liveGeo, animateShutter, onCapture]);

  if (!visible) return null;

  if (!hasCameraPerm) {
    return (
      <PermissionScreen
        type="camera"
        onGrant={handleRequestCamera}
        onClose={onClose}
        isDenied={cameraDenied}
      />
    );
  }

  // 2. Jika Butuh GeoTag tapi Izin Lokasi Belum Diberikan
  if (enableGeoTag && locPerm && locPerm.status !== "granted") {
    return (
      <PermissionScreen
        type="location"
        onGrant={handleRequestLocation}
        onClose={onClose}
        isDenied={!locPerm.canAskAgain}
      />
    );
  }

  // 3. Jika Butuh GeoTag, Izin Sudah Ada, Tapi GPS Mati di Pengaturan HP
  if (enableGeoTag && locPerm?.status === "granted" && !isGpsEnabled) {
    return (
      <PermissionScreen
        type="location_service"
        onGrant={() => {}} // Tombol otomatis buka setting OS dari dalam PermissionScreen
        onClose={onClose}
      />
    );
  }

  if (!device)
    return (
      <Portal>
        <View className="absolute inset-0 bg-black justify-center items-center">
          <Text className="text-white">Kamera tidak tersedia</Text>
        </View>
      </Portal>
    );

  const isShutterDisabled = isCapturing || (enableGeoTag && !liveGeo);
  const flashIcon = { off: "flash-off", on: "flash", auto: "flash-outline" }[
    flash
  ] as any;
  const viewfinderTop = (SCREEN_HEIGHT - viewfinder.height) / 2;

  return (
    <Portal>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View className="absolute inset-0 bg-black">
        {/* Header */}
        <View
          className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-5 pb-4 z-20"
          style={{ paddingTop: insets.top + 8 }}
        >
          {allowClose ? (
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-black/50 justify-center items-center border border-white/10"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="w-11 h-11" />
          )}
          <View className="flex-row items-center gap-2">
            <Text
              weight="bold"
              className="text-white/80 text-xs bg-black/40 px-3 py-1.5 rounded-full"
            >
              {aspectRatio}
            </Text>
            {enableGeoTag && (
              <View
                className={cn(
                  "flex-row items-center gap-1.5 px-3 py-1.5 rounded-full",
                  liveGeo ? "bg-primary" : "bg-amber-500",
                )}
              >
                <Ionicons
                  name={liveGeo ? "location" : "location-outline"}
                  size={12}
                  color="#fff"
                />
                <Text
                  weight="bold"
                  className="text-white text-[10px] uppercase tracking-wider"
                >
                  {liveGeo ? "GeoTag" : "Mencari GPS"}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            className="w-11 h-11 justify-center items-center bg-black/50 rounded-full border border-white/10"
            onPress={() =>
              setFlash(
                (p) => ({ off: "on", on: "auto", auto: "off" })[p] as any,
              )
            }
          >
            <Ionicons name={flashIcon} size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        <View
          className="absolute z-[1] overflow-hidden bg-[#111]"
          style={{
            top: viewfinderTop,
            width: viewfinder.width,
            height: viewfinder.height,
            left: 0,
          }}
        >
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            photo={true}
            zoom={zoom}
            resizeMode="cover"
          />
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "black", opacity: flashAnim, zIndex: 20 },
            ]}
          />
          {enableGeoTag && liveGeo && (
            <View
              pointerEvents="none"
              className="absolute bottom-4 left-4 right-4 z-[6]"
            >
              <View className="bg-black/60 rounded-xl py-2 px-3 border-l-4 border-primary">
                <Text
                  weight="bold"
                  className="text-white text-xs tracking-wider"
                >
                  {liveGeo.timestamp}
                </Text>
                <Text
                  weight="medium"
                  className="text-white/80 text-[10px] mt-0.5"
                >
                  {liveGeo.lat.toFixed(6)}, {liveGeo.lng.toFixed(6)}
                </Text>
                <Text
                  className="text-white text-[10px] leading-snug mt-1"
                  numberOfLines={2}
                >
                  {liveGeo.address}
                </Text>
              </View>
            </View>
          )}
        </View>

        {geoError && !liveGeo && (
          <View className="absolute bottom-40 left-6 right-6 z-30">
            <View className="flex-row items-center gap-3 bg-black/80 rounded-xl p-3 border-l-4 border-amber-500">
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text weight="medium" className="text-amber-500 text-sm flex-1">
                {geoError}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View
          className="absolute bottom-0 left-0 right-0 items-center pt-5 px-6 z-20 bg-black"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row items-center justify-between w-full mb-4 px-6">
            <View className="w-12 h-12" />
            <Animated.View style={{ transform: [{ scale: shutterAnim }] }}>
              <TouchableOpacity
                className={cn(
                  "w-20 h-20 rounded-full border-[4px] justify-center items-center",
                  isShutterDisabled
                    ? "border-white/30 opacity-50"
                    : "border-white/80",
                )}
                onPress={handleCapture}
                disabled={isShutterDisabled}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <View className="w-[66px] h-[66px] rounded-full bg-white" />
                )}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              className="w-12 h-12 bg-white/10 rounded-full justify-center items-center"
              onPress={() =>
                setFacing((p) => (p === "back" ? "front" : "back"))
              }
              disabled={isCapturing}
            >
              <Ionicons
                name="camera-reverse"
                size={24}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-white/40 text-xs mt-2">
            {isCapturing
              ? "Memproses foto..."
              : enableGeoTag && !liveGeo
                ? "Menunggu GPS..."
                : "Ketuk untuk mengambil foto"}
          </Text>
        </View>

        {pendingGeo && pendingPhotoUri && (
          <WatermarkOverlay
            overlayRef={watermarkRef}
            photoUri={pendingPhotoUri}
            geo={pendingGeo}
            dimensions={viewfinder}
            onReady={handleBurnWatermark}
          />
        )}
      </View>
    </Portal>
  );
}
