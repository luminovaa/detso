import { z } from "zod";

// Tipe statistik ringkas untuk Dashboard Super Admin
export type TenantStats = {
    total_users?: number;
    total_customers?: number;
    active_services?: number;
};

// Tipe Utama Tenant
export type Tenant = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
    created_at: Date | string;
    updated_at: Date | string;
    deleted_at?: Date | string | null;
    
    // Optional: Data relasi atau statistik
    stats?: TenantStats;
};


// Schema untuk Edit Tenant
export const editTenantSchema = z.object({
    name: z
        .string()
        .min(2, "Nama perusahaan minimal 2 karakter")
        .optional(),
        
    address: z
        .string()
        .optional()
        .or(z.literal('')),
        
    phone: z
        .string()
        .min(10, "Nomor telepon minimal 10 digit")
        .regex(/^[0-9+\-\s]+$/, "Nomor telepon tidak valid")
        .optional()
        .or(z.literal('')),
    
    // is_active dikirim sebagai string 'true'/'false' via FormData
    // Hanya Super Admin yang bisa mengubah ini
    is_active: z.enum(['true', 'false']).optional(),
    
    // Untuk file upload (Logo)
    logo: z.any().optional(),
});

// // Schema untuk Filter/Pagination (Query Params)
// export const tenantFilterSchema = z.object({
//     page: z.number().optional().default(1),
//     limit: z.number().optional().default(10),
//     search: z.string().optional(),
//     is_active: z.enum(['true', 'false']).optional(),
// });

// --- Infer Types (Otomatis generate tipe dari Zod) ---

export type EditTenantFormData = z.infer<typeof editTenantSchema>;
// export type TenantFilterParams = z.infer<typeof tenantFilterSchema>;