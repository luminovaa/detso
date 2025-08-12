import { authService } from "@/api/auth.api";
import axios from "axios";

interface ServiceOptions {
    onUnauthorized?: () => void;
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
    
    failedQueue = [];
};

const createService = (options?: ServiceOptions) => {
    const service = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        timeout: 50000,
        withCredentials: true, 
    }); 

    service.interceptors.request.use(
        (config) => {
            // Tidak perlu menambah Authorization header manual
            // karena cookies akan dikirim otomatis dengan withCredentials: true
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    const loginEndpoints = ['/auth/login', '/admin'];

    service.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const isLoginRequest = loginEndpoints.some(endpoint => 
                error.config?.url?.includes(endpoint)
            );

            // Jika 401 dan bukan login request dan belum retry
            if (error.response?.status === 401 && !isLoginRequest && !originalRequest._retry) {
                
                // Jika sedang dalam proses refresh, tambahkan ke queue
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(() => {
                        return service(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    // Coba refresh token
                    await authService.refreshToken();
                    processQueue(null);
                    return service(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError);
                    
                    // Cookies akan otomatis dihapus oleh browser jika expired
                    // atau kita bisa memanggil logout endpoint untuk menghapus cookies
                    
                    if (options?.onUnauthorized) {
                        options.onUnauthorized();
                    }
                    
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    return service;
};



export default createService();