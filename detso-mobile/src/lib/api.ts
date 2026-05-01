// lib/api.ts
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { eventBus, EVENTS } from './event-bus';
import { config } from './config';
import { refreshTokenWithLock } from './token-refresh';

const api = axios.create({
    baseURL: config.API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: config.API_TIMEOUT,
});

let failedQueue: any[] = [];
let isHandlingRefresh = false;

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// --- 1. REQUEST INTERCEPTOR ---
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
        const originalRequest: any = error.config;

        const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/logout');

        // Jika 401 (Unauthorized) dan bukan dari endpoint auth itu sendiri
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isHandlingRefresh) {
                // Another 401 came in while we're already refreshing - queue it
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isHandlingRefresh = true;

            try {
                // Use the shared lock - if store.ts is already refreshing,
                // this will piggyback on that request instead of making a new one
                const { accessToken } = await refreshTokenWithLock();

                eventBus.emit(EVENTS.AUTH.TOKEN_REFRESHED);
                processQueue(null, accessToken);

                originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);

                // Hapus token yang sudah hangus
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');

                // Pancarkan sinyal bahwa sesi benar-benar habis
                eventBus.emit(EVENTS.AUTH.SESSION_EXPIRED);
                return Promise.reject(refreshError);
            } finally {
                isHandlingRefresh = false;
            }
        }

        // Jika error 500 (Internal Server Error)
        if (error.response?.status && error.response.status >= 500) {
            eventBus.emit(EVENTS.AUTH.SERVER_ERROR, { message: error.message });
        }

        return Promise.reject(error);
    }
);

export default api;
