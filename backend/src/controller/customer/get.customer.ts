import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { paginationSchema } from './validation/validation.customer';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { getPagination } from '../../utils/pagination';

const prisma = new PrismaClient();

export const getAllCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = paginationSchema.safeParse(req.query);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { page, limit } = validationResult.data;

    const totalCustomers = await prisma.detso_Customer.count({
        where: {
            deleted_at: null
        }
    });

    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalCustomers
    });

    const customers = await prisma.detso_Customer.findMany({
        where: {
            deleted_at: null
        },
        skip,
        take: limit,
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

    const formattedCustomers = customers.map(customer => ({
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
    }));

    responseData(res, 200, 'Daftar customer berhasil diambil', {
        customers: formattedCustomers,
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