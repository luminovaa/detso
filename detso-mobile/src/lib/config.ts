/**
 * Centralized application configuration.
 * Semua environment variables dan constants dikelola di sini.
 */

/** Token Mapbox yang masuk bundle klien wajib public (pk.*), bukan secret (sk.*). */
export function assertPublicMapboxToken(token: string): string {
  if (token.startsWith('sk.')) {
    throw new Error(
      'EXPO_PUBLIC_MAPBOX_TOKEN harus token public (pk.*). Token sk.* hanya untuk RNMAPBOX_MAPS_DOWNLOAD_TOKEN saat build.'
    );
  }
  return token;
}

export const config = {
  /** Base URL untuk API backend */
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api',

  /** Mapbox public access token */
  MAPBOX_PUBLIC_TOKEN: assertPublicMapboxToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || ''),

  /** Request timeout dalam milidetik */
  API_TIMEOUT: 15000,

  /** Durasi auto-refresh sebelum token expire (dalam detik) */
  REFRESH_BEFORE_EXPIRY: 2 * 60,
} as const;
