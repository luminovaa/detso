import api from '@/src/lib/api';
import { CreateCustomerInput, GettAllInput, UpdateCustomerInput } from './schema';

export const customerService = {
    getAll : async (params?: GettAllInput) => {
        const response = await api.get('/customer', { params });
        return response.data;
    },
    getById : async (id: string) => {
        const response = await api.get(`/customer/${id}`);
        return response.data;
    },
    create : async (data: CreateCustomerInput | FormData) => {
        const isFormData = data instanceof FormData;
        const response = await api.post('/customer', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return response.data;
    },
    update : async (id: string, data: UpdateCustomerInput) => {
        const response = await api.put(`/customer/${id}`, data);
        return response.data;
    },
    delete : async (id: string) => {
        const response = await api.delete(`/customer/${id}`);
        return response.data;
    },
    /**
     * Get signed URL for PDF (authenticated request → returns signed URL)
     * The signed URL can be opened in browser without auth token (expires in 3 min)
     */
    getSignedPdfUrl: async (customerId: string): Promise<string> => {
        const response = await api.get(`/customer/pdf/${customerId}/signed-url`);
        return response.data.data.url;
    },
    checkNik: async (nik: string) => {
        const response = await api.get(`/customer/check-nik/${nik}`);
        return response.data;
    },
};
