// lib/api.ts
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { eventBus, EVENTS } from './event-bus';
import { config } from './config';

const api = axios.create({
    baseURL: config.API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: config.API_TIMEOUT,
});

let isRefreshing = false;
let failedQueue: any[] = [];

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
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                // Gunakan axios murni (bukan api) agar tidak terjadi infinite loop interceptor
                const response = await axios.post(`${config.API_URL}/auth/refresh`, { refreshToken });

                // Sesuaikan dengan response body dari backend-mu
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

                await SecureStore.setItemAsync('accessToken', newAccessToken);
                if (newRefreshToken) await SecureStore.setItemAsync('refreshToken', newRefreshToken);

                eventBus.emit(EVENTS.AUTH.TOKEN_REFRESHED);
                processQueue(null, newAccessToken);

                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);

                // Hapus token yang sudah hangus
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');

                // Pancarkan sinyal bahwa sesi benar-benar habis (waktunya ke layar login)
                eventBus.emit(EVENTS.AUTH.SESSION_EXPIRED);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Jika error 500 (Internal Server Error)
        if (error.response?.status && error.response.status >= 500) {
            // PANCARKAN SINYAL (Bukan panggil hook)
            eventBus.emit(EVENTS.AUTH.SERVER_ERROR, { message: error.message });
        }

        return Promise.reject(error);
    }
);

export default api;