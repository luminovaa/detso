import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Button } from "@/src/components/global/button";
import { showToast } from "@/src/components/global/toast";
import { Text } from "@/src/components/global/text";
import { PermissionScreen } from "@/src/components/global/permission";

Mapbox.setAccessToken("pk.GANTI_DENGAN_PUBLIC_TOKEN_MAPBOX_ANDA");

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  initialCoordinate?: { latitude: number; longitude: number } | null;
  initialAddress?: string;
}

export function MapLocationPicker({
  visible,
  onClose,
  onLocationSelected,
  initialCoordinate,
  initialAddress = "",
}: MapLocationPickerProps) {
  const [mapRegion, setMapRegion] = useState({
    latitude: initialCoordinate?.latitude || -6.2,
    longitude: initialCoordinate?.longitude || 106.816666,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [tempMarker, setTempMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialCoordinate
      ? { lat: initialCoordinate.latitude, lng: initialCoordinate.longitude }
      : null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addressText, setAddressText] = useState(initialAddress);

  // Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isLocationServiceOff, setIsLocationServiceOff] = useState(false);

  const fetchAddressFromCoords = useCallback(
    async (latitude: number, longitude: number) => {
      setIsReverseGeocoding(true);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (results.length > 0) {
          const place = results[0];
          const addressParts = [
            place.street,
            place.district,
            place.city || place.subregion,
            place.region,
            place.postalCode,
          ].filter(Boolean);

          const formattedAddress = addressParts.join(", ");
          if (formattedAddress) {
            setAddressText(formattedAddress);
          }
        }
      } catch (error) {
        console.log("Failed to reverse geocode:", error);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [],
  );

  const handleCurrentLocation = useCallback(async () => {
    try {
      // 1. Check Location Services (GPS)
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setIsLocationServiceOff(true);
        return;
      }

      // 2. Check Permissions
      const { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
        setIsLocating(true);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        setTempMarker({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        await fetchAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
        setIsLocating(false);
      } else if (!canAskAgain) {
        setIsPermissionDenied(true);
        setShowPermissionModal(true);
      } else {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.log("Error checking location:", error);
      showToast.error("Gagal", "Tidak dapat mengambil lokasi saat ini.");
      setIsLocating(false);
    }
  }, [fetchAddressFromCoords]);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setShowPermissionModal(false);
        handleCurrentLocation();
      } else {
        // User denied from the prompt
        setIsPermissionDenied(true);
      }
    } catch (error) {
      console.log("Error requesting permission:", error);
    }
  };

  useEffect(() => {
    if (visible && !initialCoordinate) {
      handleCurrentLocation();
    } else if (visible && initialCoordinate) {
      setMapRegion({
        latitude: initialCoordinate.latitude,
        longitude: initialCoordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setTempMarker({
        lat: initialCoordinate.latitude,
        lng: initialCoordinate.longitude,
      });
    }
  }, [visible, initialCoordinate, handleCurrentLocation]);

  const handleSearchAddress = async () => {
    Keyboard.dismiss();
    if (!addressText || addressText.trim().length === 0) {
      showToast.error(
        "Gagal",
        "Alamat kosong. Silakan isi alamat terlebih dahulu.",
      );
      return;
    }

    setIsSearching(true);
    try {
      const result = await Location.geocodeAsync(addressText);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        setTempMarker({ lat: latitude, lng: longitude });

        await fetchAddressFromCoords(latitude, longitude);
      } else {
        showToast.error(
          "Tidak Ditemukan",
          "Alamat tidak dapat ditemukan di peta.",
        );
      }
    } catch {
      showToast.error("Gagal", "Terjadi kesalahan saat mencari alamat.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmLocation = () => {
    if (tempMarker) {
      onLocationSelected(tempMarker.lat, tempMarker.lng, addressText);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={StyleSheet.absoluteFill}
        className="bg-background z-50"
      >
        <View className="pt-12 pb-4 px-4 flex-row items-center justify-between bg-card border-b border-border shadow-sm z-10">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center rounded-full bg-muted"
          >
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text weight="bold" className="text-lg">
            Pilih Lokasi
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 relative">
          <Mapbox.MapView
            style={StyleSheet.absoluteFill}
            logoEnabled={false}
            scaleBarEnabled={false}
            onPress={(e) => {
              // Mapbox onPress returns a GeoJSON Feature
              const coords = e.geometry.coordinates;
              const longitude = coords[0];
              const latitude = coords[1];
              setTempMarker({ lat: latitude, lng: longitude });
              fetchAddressFromCoords(latitude, longitude);
            }}
          >
            <Mapbox.Camera
              zoomLevel={15}
              centerCoordinate={[mapRegion.longitude, mapRegion.latitude]}
              animationMode="flyTo"
              animationDuration={1000}
            />

            {tempMarker && (
              <Mapbox.PointAnnotation
                id="selected-location"
                coordinate={[tempMarker.lng, tempMarker.lat]}
              />
            )}

            <Mapbox.LocationPuck />
          </Mapbox.MapView>

          <View className="absolute top-4 left-4 right-4 bg-black/70 px-4 py-3 rounded-xl flex-row items-center gap-3">
            <Ionicons name="information-circle" size={24} color="#FCD34D" />
            <Text className="text-white text-xs flex-1">
              Geser peta dan ketuk di lokasi untuk meletakkan pin kordinat.
            </Text>
          </View>

          <View className="absolute bottom-6 right-4 gap-3">
            <TouchableOpacity
              onPress={handleCurrentLocation}
              disabled={isLocating}
              className="bg-primary shadow-[0_3px_10px_rgb(0,0,0,0.2)] p-3 rounded-full self-end items-center justify-center"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="locate" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-4 bg-card border-t border-border shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <View className="mb-4">
            <Text weight="semibold" className="text-sm mb-2">
              Detail Alamat Lengkap
            </Text>
            <View className="flex-row items-center border border-border rounded-xl px-3 py-1 bg-background focus:border-primary">
              <TextInput
                className="flex-1 text-foreground text-sm py-2 min-h-[44px]"
                placeholder="Ketik alamat lengkap..."
                placeholderTextColor="#94A3B8"
                value={addressText}
                onChangeText={setAddressText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSearchAddress}
                disabled={
                  isSearching || isReverseGeocoding || addressText.trim() === ""
                }
                className="bg-primary/10 w-10 h-10 rounded-lg items-center justify-center ml-2"
              >
                {isSearching || isReverseGeocoding ? (
                  <ActivityIndicator size="small" color="#1E40AF" />
                ) : (
                  <Text weight="bold" className="text-primary text-sm">
                    Cari
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {tempMarker ? (
            <Button
              title="Konfirmasi Lokasi Ini"
              leftIcon={
                <Ionicons name="checkmark-circle" size={20} color="white" />
              }
              size="lg"
              onPress={handleConfirmLocation}
              disabled={!addressText.trim()}
            />
          ) : (
            <Text className="text-center text-muted-foreground py-3">
              Silakan ketuk peta untuk memilih lokasi.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Permission Modals */}
      {showPermissionModal && (
        <PermissionScreen
          type="location"
          isDenied={isPermissionDenied}
          onGrant={requestPermission}
          onClose={() => setShowPermissionModal(false)}
        />
      )}

      {isLocationServiceOff && (
        <PermissionScreen
          type="location_service"
          onGrant={() => {}} // Not used for location_service type, it opens settings
          onClose={() => setIsLocationServiceOff(false)}
        />
      )}
    </Modal>
  );
}
