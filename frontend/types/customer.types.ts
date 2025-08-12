import z from "zod";
import { Package } from "./package.types";

export type Customer = {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    nik?: string;
    birth_date?: Date;
    birth_place?: string;
    address?: string;
    created_at?: Date;
    updated_at?: Date;
    documents?: Customer_Document[]
    services?: Service_Connection[]
}

export type Customer_Document = {
    id?: string;
    customer_id: string;
    document_type: string;
    document_url: string;
    uploaded_at?: Date;
    customer?: Customer;
}

export type DocumentData = {
  type: string;
  file?: File;
}

export type PhotoData = {
  type: string;
  file?: File;
}


export type Service_Connection = {
    id?: string;
    customer_id: string;
    id_pel: string;
    package_id: string;
    package_name: string;
    package_speed: string;
    package_price: string;
    ip_address?: string;
    lat?: string;
    long?: string;
    mac_address?: string;
    status?: status;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;

    customer?: Customer;
    package?: Package;

    pdf?: Customer_PDF[]
    photos?: Customer_Photo[]
}


export type Customer_Photo = {
    id?: string;
    service_id: string;
    photo_type: string;
    photo_url: string;
    uploaded_at?: Date;
    notes?: string;

    service?: Service_Connection
}

export type Customer_PDF = {
    id?: string;
    customer_id: string;
    service_connection_id: string;
    pdf_type: string;
    pdf_path: string;
    generated_at?: Date;

    customer?: Customer;
    service_connection?: Service_Connection;
}

enum status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}

const photoSchema = z.object({
  type: z.string().min(1, 'Jenis foto harus diisi'),
});

const documentSchema = z.object({
  type: z.string().min(1, { message: 'Jenis dokumen wajib diisi' }),
  id: z.string().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 karakter').optional(),
  email: z.string().email('Email tidak valid').optional(),
  nik: z.string().min(16, 'NIK harus 16 karakter'),
  package_id: z.string().min(1, 'Package ID harus diisi'),
  address_service: z.string().min(10, 'Alamat minimal 10 karakter'),
  address: z.string().min(10, 'Alamat minimal 10 karakter'),
  lat: z.string().optional(),
  long: z.string().optional(),
  birth_date: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  birth_place: z.string().optional(),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional().default([]),
  photos: z.array(photoSchema).optional().default([]),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

