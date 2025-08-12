import services from "@/services/services";

export const authService = {
    login: async (credentials: { identifier: string; password: string }) => {
        const response = await services.post('/auth/login', credentials);
        
        return response.data.data;
    },

    logout: async () => {
        try {
            await services.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    changePassword: async (oldPassword: string, password: string, confirmPassword: string) => {
        const response = await services.patch('/user/change-password', { oldPassword, password, confirmPassword });
        return response.data;
    },

    refreshToken: async () => {
        const response = await services.post('/auth/refresh');
        return response.data;
    },

    getCurrentUser: async () => {
        try {
            const response = await services.get('/auth/me'); 
            return response.data.data;
        } catch (error) {
            return null;
        }
    },

    // Method untuk verify session
    verifySession: async () => {
        try {
            const response = await services.get('/auth/verify');
            return response.data;
        } catch (error) {
            return null;
        }
    }
};