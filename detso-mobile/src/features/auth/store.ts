/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LoginInput } from './schema';
import { authService } from './service';
import { getSecondsUntilExpiry, isTokenExpired } from '@/src/lib/jwt';

interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  gender: string | null;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenant_id: string | null;
  profile?: UserProfile;
  createdAt?: string;
  exp?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  refreshTimer: any | null; // ← TAMBAHKAN INI
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  setupAutoRefresh: () => Promise<void>; // ← TAMBAHKAN INI
  clearAutoRefresh: () => void; // ← TAMBAHKAN INI
}

const REFRESH_BEFORE_EXPIRY = 2 * 60; // 2 menit sebelum expire (dalam detik)

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  refreshTimer: null,

  login: async (data: LoginInput) => {
    console.log('Login attempt:', data);
    set({ isLoading: true });
    try {
      const response = await authService.login(data);
      // response is { success, message, data: { accessToken, refreshToken, ...userFields } }
      const { accessToken, refreshToken, ...user } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      await get().refreshUserData();

      set({ user, isLoading: false, isInitialized: true });
      console.log('Login successful:', user);
      // ← SETUP AUTO REFRESH SETELAH LOGIN
      get().setupAutoRefresh();

      // router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // ← CLEAR TIMER SEBELUM LOGOUT
    get().clearAutoRefresh();

    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isLoading: false, isInitialized: true });
      // router.replace('/auth/login');
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Cek apakah token sudah expire
        if (isTokenExpired(token)) {
          console.log('Token expired, trying to refresh...');
          await get().setupAutoRefresh(); // Coba refresh dulu
          return;
        }

        const response = await authService.getMe();
        set({ user: response.data, isInitialized: true });

        // ← SETUP AUTO REFRESH SETELAH CHECK AUTH
        get().setupAutoRefresh();

        // router.replace('/(tabs)');
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isInitialized: true });
    }
  },

  refreshUserData: async () => {
    try {
      const response = await authService.getMe();
      set({ user: response.data });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  },

  // ← FUNGSI AUTO REFRESH TOKEN
  setupAutoRefresh: async () => {
    try {
      console.log('🔄 [AUTO-REFRESH] Starting setup...');

      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (!accessToken || !refreshToken) {
        console.log('❌ [AUTO-REFRESH] No tokens found');
        return;
      }

      get().clearAutoRefresh();

      const secondsUntilExpiry = getSecondsUntilExpiry(accessToken);
      console.log(`⏰ [AUTO-REFRESH] Token expires in ${(secondsUntilExpiry / 60).toFixed(1)} minutes`);

      if (secondsUntilExpiry <= 0) {
        console.log('⚠️ [AUTO-REFRESH] Token already expired, refreshing NOW...');

        try {
          const response = await authService.refreshToken(refreshToken);

          // ✅ PERBAIKAN: Cek apakah ada refreshToken baru atau pakai yang lama
          const newAccessToken = response.data.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token in response');
          }

          await SecureStore.setItemAsync('accessToken', newAccessToken);

          // Hanya update refreshToken jika ada yang baru
          if (response.data.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            console.log('✅ [AUTO-REFRESH] Both tokens refreshed');
          } else {
            console.log('✅ [AUTO-REFRESH] Access token refreshed (using existing refresh token)');
          }

          await get().refreshUserData();
          get().setupAutoRefresh();
        } catch (error) {
          console.error('❌ [AUTO-REFRESH] Refresh failed:', error);
          get().logout();
        }
        return;
      }

      const refreshIn = Math.max(5, secondsUntilExpiry - REFRESH_BEFORE_EXPIRY);
      const refreshInMs = refreshIn * 1000;

      console.log(`⏰ [AUTO-REFRESH] Will refresh in ${(refreshIn / 60).toFixed(1)} minutes`);
      console.log(`🕐 [AUTO-REFRESH] Refresh scheduled at: ${new Date(Date.now() + refreshInMs).toLocaleTimeString()}`);

      const timer = setTimeout(async () => {
        console.log('🔄 [AUTO-REFRESH] Timer triggered! Refreshing token...');

        try {
          const currentRefreshToken = await SecureStore.getItemAsync('refreshToken');

          if (!currentRefreshToken) {
            console.log('❌ [AUTO-REFRESH] No refresh token found, logging out...');
            get().logout();
            return;
          }

          console.log('📡 [AUTO-REFRESH] Calling refresh API...');
          const response = await authService.refreshToken(currentRefreshToken);

          console.log('📦 [AUTO-REFRESH] Response received:', {
            hasAccessToken: !!response.data?.accessToken,
            hasRefreshToken: !!response.data?.refreshToken
          });

          // ✅ PERBAIKAN: Handle refreshToken yang optional
          const newAccessToken = response.data.accessToken;

          if (!newAccessToken) {
            throw new Error('Invalid refresh response - no access token');
          }

          await SecureStore.setItemAsync('accessToken', newAccessToken);

          // Update refreshToken hanya jika ada yang baru
          if (response.data.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            console.log('✅ [AUTO-REFRESH] Both tokens saved');
          } else {
            console.log('✅ [AUTO-REFRESH] Access token saved (refresh token unchanged)');
          }

          await get().refreshUserData();

          console.log('🔁 [AUTO-REFRESH] Setting up next cycle...');
          get().setupAutoRefresh();

        } catch (error: any) {
          console.error('❌ [AUTO-REFRESH] Failed:', error);
          console.error('❌ [AUTO-REFRESH] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          get().logout();
        }
      }, refreshInMs);

      set({ refreshTimer: timer });
      console.log('✅ [AUTO-REFRESH] Timer set successfully');

    } catch (error) {
      console.error('❌ [AUTO-REFRESH] Setup failed:', error);
    }
  },
  clearAutoRefresh: () => {
    const { refreshTimer } = get();
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      set({ refreshTimer: null });
      console.log('🗑️ [AUTO-REFRESH] Timer cleared');
    }
  }
}));