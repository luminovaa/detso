/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LoginInput } from './schema';
import { authService } from './service';
import { getSecondsUntilExpiry, isTokenExpired } from '@/src/lib/jwt';
import { showToast } from '@/src/components/global/toast';
import { showErrorToast } from '@/src/lib/api-error';
import { config } from '@/src/lib/config';
import { eventBus, EVENTS } from '@/src/lib/event-bus';
import { refreshTokenWithLock, isRefreshInProgress } from '@/src/lib/token-refresh';
import { useLanguageStore } from '@/src/features/i18n/store';

interface UserProfile {
  id: string;
  full_name: string;
  avatar: string | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  tenant_id: string | null;
  profile?: UserProfile;
  exp?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  refreshTimer: any | null;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  setupAutoRefresh: () => Promise<void>;
  clearAutoRefresh: () => void;
}

const REFRESH_BEFORE_EXPIRY = config.REFRESH_BEFORE_EXPIRY;

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
      const { accessToken, refreshToken, ...user } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      await get().refreshUserData();

      set({ user, isLoading: false, isInitialized: true });
      console.log('Login successful:', user);

      get().setupAutoRefresh();
      const _t = (key: string) => {
        const { locale, i18n } = useLanguageStore.getState();
        return i18n.t(key, { locale });
      };
      showToast.success(_t("auth.loginSuccessTitle"), _t("auth.loginSuccessDesc"));
    } catch (error: any) {
      set({ isLoading: false });
      const _t = (key: string) => {
        const { locale, i18n } = useLanguageStore.getState();
        return i18n.t(key, { locale });
      };
      showErrorToast(error, _t('auth.loginFailedTitle'));
      throw error;
    }
  },

  logout: async () => {
    get().clearAutoRefresh();

    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isLoading: false, isInitialized: true });
      eventBus.emit(EVENTS.AUTH.LOGOUT);
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Cek apakah token sudah expire
        if (isTokenExpired(token)) {
          console.log('Token expired, trying to refresh...');
          await get().setupAutoRefresh();
          return;
        }

        const response = await authService.getMe();
        set({ user: response.data, isInitialized: true });

        get().setupAutoRefresh();
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

  // Auto-refresh token sebelum expire
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

        // Skip if interceptor is already handling a refresh
        if (isRefreshInProgress()) {
          console.log('🔒 [AUTO-REFRESH] Refresh already in progress (interceptor), skipping...');
          // Re-schedule check in 3 seconds
          const retryTimer = setTimeout(() => get().setupAutoRefresh(), 3000);
          set({ refreshTimer: retryTimer });
          return;
        }

        try {
          await refreshTokenWithLock();
          await get().refreshUserData();
          get().setupAutoRefresh(); // Schedule next cycle
        } catch (error) {
          console.error('❌ [AUTO-REFRESH] Refresh failed:', error);
          get().logout();
        }
        return;
      }

      // Schedule refresh N seconds before expiry
      const refreshIn = Math.max(5, secondsUntilExpiry - REFRESH_BEFORE_EXPIRY);
      const refreshInMs = refreshIn * 1000;

      console.log(`⏰ [AUTO-REFRESH] Will refresh in ${(refreshIn / 60).toFixed(1)} minutes`);

      const timer = setTimeout(async () => {
        console.log('🔄 [AUTO-REFRESH] Timer triggered! Refreshing token...');

        // Skip if interceptor is already handling a refresh
        if (isRefreshInProgress()) {
          console.log('🔒 [AUTO-REFRESH] Refresh already in progress (interceptor), rescheduling...');
          get().setupAutoRefresh();
          return;
        }

        try {
          await refreshTokenWithLock();

          console.log('✅ [AUTO-REFRESH] Token refreshed successfully');
          await get().refreshUserData();

          console.log('🔁 [AUTO-REFRESH] Setting up next cycle...');
          get().setupAutoRefresh();

        } catch (error: any) {
          console.error('❌ [AUTO-REFRESH] Failed:', error?.message || error);
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
