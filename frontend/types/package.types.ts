import { z } from "zod";

export type Package = {
    id?: string;
    name: string;
    speed: string;
    price: number;
    created_at?: Date;
    updated_at?: Date;
}

export const createPackageSchema = z.object({
    name: z
        .string()
        .min(2, "Nama paket minimal 2 karakter")
        .max(100, "Nama paket maksimal 100 karakter"),
    speed: z
        .string()
        .min(1, "Kecepatan wajib diisi"),
    price: z
        .coerce.number()
        .nonnegative("Harga tidak boleh negatif")
        .min(1000, "Harga minimal Rp1.000")
        .max(1_000_000_000, "Harga maksimal Rp1.000.000.000"),
});

export type CreatePackageFormData = z.infer<typeof createPackageSchema>;