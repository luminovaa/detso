import api from '@/src/lib/api';
import { LoginInput, RegisterInput } from './schema';

export const authService = {
    login: async (data: LoginInput) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },
    register: async (data: RegisterInput) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    registerTenant: async (data: RegisterInput | FormData) => {
        const isFormData = data instanceof FormData;
        const response = await api.post('/auth/register/tenant', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
    refreshToken: async (refreshToken?: string) => {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    },
    verify: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    activeSessions: async () => {
        const response = await api.get('/auth/active-sessions');
        return response.data;
    },
    revokeSession: async (sessionId: string) => {
        const response = await api.post(`/auth/session/revoke/${sessionId}`);
        return response.data;
    },
};
