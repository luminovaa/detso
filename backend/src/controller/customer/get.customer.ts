import { Request, Response } from 'express';
import { paginationSchema } from './validation/validation.customer';
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { getPagination } from '../../utils/pagination';
import { prisma } from '../../utils/prisma';
import { generateFullUrl } from '../../utils/generate-full-url';
import { generateSignedUrl } from '../../utils/signed-url';
import { getParam } from '../../utils/request.utils';

export const getAllCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenant_id = user.tenant_id;

    const validationResult = paginationSchema.safeParse(req.query);
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.issues);
    }

    const { page, limit, search } = validationResult.data;

    // Base where clause — scoped to tenant
    const whereClause: any = {
        tenant_id,
        deleted_at: null,
    };

    // Search across customer fields + nested service fields
    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { nik: { contains: search } },
            {
                service: {
                    some: {
                        deleted_at: null,
                        OR: [
                            { package_name: { contains: search, mode: 'insensitive' } },
                            { address: { contains: search, mode: 'insensitive' } },
                            { id_pel: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                }
            }
        ];
    }

    const totalCustomers = await prisma.detso_Customer.count({ where: whereClause });

    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalCustomers,
    });

    const customers = await prisma.detso_Customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
            _count: {
                select: {
                    service: {
                        where: { deleted_at: null }
                    }
                }
            },
            service: {
                where: { deleted_at: null },
                select: {
                    id: true,
                    package_name: true,
                    status: true,
                },
                orderBy: { created_at: 'desc' },
            },
        },
        orderBy: { created_at: 'desc' },
    });

    const formattedCustomers = customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        nik: customer.nik,
        created_at: customer.created_at,
        service_count: customer._count.service,
        services_summary: customer.service.map(s => ({
            id: s.id,
            package_name: s.package_name,
            status: s.status,
        })),
    }));

    responseData(res, 200, 'Daftar customer berhasil diambil', {
        customers: formattedCustomers,
        pagination,
    });
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customerId = getParam(req.params.id);
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }

    const customer = await prisma.detso_Customer.findFirst({
        where: {
            id: customerId,
            tenant_id: user.tenant_id,
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

    // Check if installation report PDF exists
    const installationReport = await prisma.detso_Customer_PDF.findFirst({
        where: {
            customer_id: customerId,
            pdf_type: 'installation_report'
        },
        select: { id: true }
    });

    const formattedCustomer = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        nik: customer.nik,
        created_at: customer.created_at,
        has_installation_report: !!installationReport,
        documents: customer.documents.map(doc => ({
            ...doc,
            document_url: generateSignedUrl(doc.document_url, 180) // 3 minutes expiry
        })),
        services: customer.service.map(service => ({
            id: service.id,
            package_name: service.package_name,
            package_speed: service.package_speed,
            status: service.status,
            address: service.address,
            ip_address: service.ip_address,
            mac_address: service.mac_address,
            lat: service.lat,
            long: service.long,
            created_at: service.created_at,
            package_details: service.package,
            photos: service.photos.map(photo => ({
                ...photo,
                photo_url: generateFullUrl(photo.photo_url)
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
    const tenant_id = user.tenant_id;

    const nik = getParam(req.params.nik);

    if (!nik) {
        throw new NotFoundError('NIK harus disertakan');
    }

    // [NEW] 2. Cek NIK hanya di dalam lingkup Tenant ini
    const customer = await prisma.detso_Customer.findFirst({
        where: {
            nik: nik,
            tenant_id: tenant_id, // <--- Filter wajib!
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