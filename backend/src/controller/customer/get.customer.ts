import { Request, Response } from 'express';
import { paginationSchema } from './validation/validation.customer';
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { getPagination } from '../../utils/pagination';
import { prisma } from '../../utils/prisma';

export const getAllServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id dari session user
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    const validationResult = paginationSchema.safeParse(req.query);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { page, limit, search, status, package_name } = validationResult.data;

    // [NEW] 2. Masukkan tenant_id ke Base Query
    // Ini memastikan SEMUA filter di bawahnya hanya berjalan di dalam lingkup tenant ini
    const whereClause: any = {
        tenant_id: tenantId, // <--- KUNCI KEAMANAN SAAS
        deleted_at: null
    };

    if (status) {
      whereClause.status = status; 
    }

    if (package_name) {
      whereClause.package_name = {
        contains: package_name,
        mode: 'insensitive',
      };
    }

    if (search) {
        whereClause.OR = [
            { id_pel: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { mac_address: { contains: search } },
            { package_name: { contains: search, mode: 'insensitive' } },
            {
                customer: {
                    // Karena relasi customer -> tenant juga ada,
                    // filter di root `detso_Service_Connection` sudah cukup.
                    // Tapi pencarian di tabel customer tetap aman.
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            }
        ];
    }

    const totalServices = await prisma.detso_Service_Connection.count({
        where: whereClause
    });

    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalServices
    });

    const services = await prisma.detso_Service_Connection.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    nik: true,
                    address: true,
                    created_at: true,
                    documents: {
                        select: {
                            id: true,
                            document_type: true,
                            document_url: true,
                            uploaded_at: true
                        }
                    }
                }
            },
            package: {
                select: {
                    name: true,
                    speed: true,
                    price: true
                }
            },
            photos: {
                select: {
                    id: true,
                    photo_type: true,
                    photo_url: true,
                    uploaded_at: true,
                    notes: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const baseUrl = process.env.BASE_URL;

    const addBaseUrl = (path: string | null | undefined): string | null => {
        if (!path) return null;
        return `${baseUrl}/${path}`;
    };

    const formattedServices = services.map(service => ({
        id: service.id,
        id_pel: service.id_pel,
        package_name: service.package_name,
        package_speed: service.package_speed,
        package_price: service.package_price,
        address: service.address,
        ip_address: service.ip_address,
        mac_address: service.mac_address,
        status: service.status,
        created_at: service.created_at,
        package_details: service.package,
        photos: service.photos.map(photo => ({
            ...photo,
            photo_url: addBaseUrl(photo.photo_url)
        })),
        customer: {
            ...service.customer,
            documents: service.customer.documents.map(doc => ({
                ...doc,
                document_url: addBaseUrl(doc.document_url)
            }))
        }
    }));

    responseData(res, 200, 'Daftar layanan berhasil diambil', {
        services: formattedServices,
        pagination
    });
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customerId = req.params.id;

    const customer = await prisma.detso_Customer.findUnique({
        where: {
            id: customerId,
            deleted_at: null
        },
        include: {
            documents: {
                select: {
                    id: true,
                    document_type: true,
                    document_url: true,
                    uploaded_at: true
                }
            },
            service: {
                where: {
                    deleted_at: null
                },
                include: {
                    package: {
                        select: {
                            name: true,
                            speed: true,
                            price: true
                        }
                    },
                    photos: {
                        select: {
                            id: true,
                            photo_type: true,
                            photo_url: true,
                            uploaded_at: true,
                            notes: true
                        }
                    }
                }
            }
        }
    });

    if (!customer) {
        throw new NotFoundError('Customer tidak ditemukan atau telah dihapus');
    }

    const baseUrl = process.env.BASE_URL;

    const addBaseUrl = (path: string | null | undefined): string | null => {
        if (!path) return null;
        return `${baseUrl}/${path}`;
    };

    const formattedCustomer = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        nik: customer.nik,
        created_at: customer.created_at,
        documents: customer.documents.map(doc => ({
            ...doc,
            document_url: addBaseUrl(doc.document_url)
        })),
        services: customer.service.map(service => ({
            id: service.id,
            package_name: service.package_name,
            package_speed: service.package_speed,
            status: service.status,
            address: service.address,
            ip_address: service.ip_address,
            mac_address: service.mac_address,
            created_at: service.created_at,
            package_details: service.package,
            photos: service.photos.map(photo => ({
                ...photo,
                photo_url: addBaseUrl(photo.photo_url)
            }))
        }))
    };

    responseData(res, 200, 'Data customer berhasil diambil', formattedCustomer);
});


export const checkCustomerByNik = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id dari user yang sedang login
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    const { nik } = req.params;

    if (!nik) {
        throw new NotFoundError('NIK harus disertakan');
    }

    // [NEW] 2. Cek NIK hanya di dalam lingkup Tenant ini
    const customer = await prisma.detso_Customer.findFirst({
        where: {
            nik: nik,
            tenant_id: tenantId, // <--- Filter wajib!
            deleted_at: null
        },
        select: {
            id: true,
            nik: true,
            name: true // Opsional: kembalikan nama untuk konfirmasi operator
        }
    });

    responseData(res, 200, 'Berhasil memeriksa NIK customer', {
        exists: !!customer,
        customer: customer || null
    });
});