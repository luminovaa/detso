/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dimensions } from "react-native";
import * as Location from "expo-location";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16" | "3:4";

export interface GeoInfo {
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
}

const RATIO_MAP: Record<AspectRatio, number> = {
  "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9, "9:16": 9 / 16, "3:4": 3 / 4,
};

export function getViewfinderDimensions(ratio: AspectRatio) {
  const r = RATIO_MAP[ratio];
  const width = SCREEN_WIDTH;
  const height = width / r;
  return { width, height };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const geoCodedAddress = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (geoCodedAddress && geoCodedAddress.length > 0) {
      const addressObj = geoCodedAddress[0];
      const addressParts = [
        addressObj.street, addressObj.streetNumber, addressObj.district,
        addressObj.subregion, addressObj.region,
      ].filter(Boolean);
      if (addressParts.length > 0) return addressParts.join(", ");
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

export async function getFileSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    return 0;
  }
}

export function calculateCompressionQuality(currentSizeBytes: number, targetMB: number = 4.5): number {
  const targetBytes = targetMB * 1024 * 1024;
  if (currentSizeBytes <= targetBytes) return 0.8;
  const ratio = targetBytes / currentSizeBytes;
  if (ratio < 0.2) return 0.4;
  if (ratio < 0.5) return 0.6;
  return 0.7;
}

export const formatTimestamp = (date: Date) => {
  return date.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) + " WIB";
};