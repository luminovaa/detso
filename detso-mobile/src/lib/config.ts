/**
 * Centralized application configuration.
 * Semua environment variables dan constants dikelola di sini.
 */
export const config = {
  /** Base URL untuk API backend */
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api',

  /** Mapbox public access token */
  MAPBOX_PUBLIC_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',

  /** Request timeout dalam milidetik */
  API_TIMEOUT: 15000,

  /** Durasi auto-refresh sebelum token expire (dalam detik) */
  REFRESH_BEFORE_EXPIRY: 2 * 60,
} as const;
