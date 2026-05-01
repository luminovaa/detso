/**
 * Centralized Token Refresh Manager
 *
 * Solves the race condition between:
 * 1. Proactive auto-refresh timer (store.ts)
 * 2. Reactive 401 interceptor (api.ts)
 *
 * Both layers now go through this single lock. Only ONE refresh request
 * can be in-flight at any time. Concurrent callers receive the same promise.
 *
 * Uses raw axios (NOT the `api` instance) to avoid triggering the
 * response interceptor and creating infinite loops.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from './config';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

// ─── Singleton State ─────────────────────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<RefreshResult> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 *
 * If a refresh is already in-flight, returns the existing promise so
 * all concurrent callers get the same result (no duplicate requests).
 *
 * @returns The new access token and refresh token pair.
 * @throws If refresh fails (token expired, revoked, network error, etc.)
 */
export async function refreshTokenWithLock(): Promise<RefreshResult> {
  // If already refreshing, piggyback on the existing request
  if (isRefreshing && refreshPromise) {
    console.log('🔒 [TOKEN-REFRESH] Already refreshing, waiting for existing request...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = performRefresh();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * Check if a refresh is currently in progress.
 * Useful for the auto-refresh timer to skip if interceptor is already handling it.
 */
export function isRefreshInProgress(): boolean {
  return isRefreshing;
}

// ─── Internal ────────────────────────────────────────────────────

async function performRefresh(): Promise<RefreshResult> {
  const currentRefreshToken = await SecureStore.getItemAsync('refreshToken');

  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('📡 [TOKEN-REFRESH] Sending refresh request...');

  // Use raw axios to bypass the api interceptor (prevents infinite loop)
  const response = await axios.post(
    `${config.API_URL}/auth/refresh`,
    { refreshToken: currentRefreshToken },
    { timeout: config.API_TIMEOUT }
  );

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;

  if (!accessToken) {
    throw new Error('No access token in refresh response');
  }

  // Persist new tokens
  await SecureStore.setItemAsync('accessToken', accessToken);

  if (newRefreshToken) {
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);
    console.log('✅ [TOKEN-REFRESH] Both tokens updated');
  } else {
    console.log('✅ [TOKEN-REFRESH] Access token updated (refresh token unchanged)');
  }

  return {
    accessToken,
    refreshToken: newRefreshToken || currentRefreshToken,
  };
}
