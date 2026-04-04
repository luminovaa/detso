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
    create : async (data: CreateCustomerInput) => {
        const response = await api.post('/customer', data);
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
    getPdf: async (id: string) => {
        const response = await api.get(`/customer/pdf/${id}/download`);
        return response.data;
    },
    viewPdf: async (id: string) => {
        const response = await api.get(`/customer/pdf/${id}/view`);
        return response.data;
    },
    checkNik: async (nik: string) => {
        const response = await api.get(`/customer/check-nik/${nik}`);
        return response.data;
    },
};
