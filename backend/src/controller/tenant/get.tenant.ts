import { Request, Response } from "express";
import { Detso_Role } from "@prisma/client";
import { asyncHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from "../../utils/error-handler";
import { responseData } from "../../utils/response-handler";
import { prisma } from "../../utils/prisma";
import { getPagination } from "../../utils/pagination";
import { tenantPaginationSchema } from "./validation/validation.tenant";

// [SUPER ADMIN ONLY]


const baseUrl = process.env.BASE_URL;

export const getAllTenants = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Security Check
    const user = req.user;
    if (!user) throw new AuthenticationError('Sesi tidak valid');

    // Hanya Super Admin yang boleh lihat daftar semua ISP
    if (user.role !== Detso_Role.SAAS_SUPER_ADMIN) {
        throw new AuthorizationError('Anda tidak memiliki izin untuk melihat daftar Tenant.');
    }

    // 2. Validation
    const validationResult = tenantPaginationSchema.safeParse(req.query);
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const { page, limit, search, is_active } = validationResult.data;

    // 3. Query Builder
    const whereClause: any = {
        deleted_at: null
    };

    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (is_active) {
        whereClause.is_active = is_active === 'true';
    }

    // 4. Execute Query
    const totalTenants = await prisma.detso_Tenant.count({
        where: whereClause
    });

    const { skip, pagination } = getPagination({
        page,
        limit,
        totalItems: totalTenants
    });

    const tenants = await prisma.detso_Tenant.findMany({
        where: whereClause,
        skip,
        take: limit,
        // Include statistik ringkas untuk dashboard Super Admin
        include: {
            _count: {
                select: {
                    users: { where: { deleted_at: null } },
                    customers: { where: { deleted_at: null } },
                    services: { where: { status: 'ACTIVE', deleted_at: null } }
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    // Format response agar lebih rapi
    const formattedTenants = tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        is_active: t.is_active,
        address: t.address,
        phone: t.phone,
        logo: t.logo ? `${baseUrl}/${t.logo}` : null,
        created_at: t.created_at,
        stats: {
            total_users: t._count.users,
            total_customers: t._count.customers,
            active_services: t._count.services
        }
    }));

    responseData(res, 200, 'Daftar Tenant berhasil diambil', {
        tenants: formattedTenants,
        pagination
    });
});

// [SUPER ADMIN & TENANT OWNER/ADMIN (Self only)]
export const getTenantById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) throw new AuthenticationError('Sesi tidak valid');

    const tenantIdParam = req.params.id;

    // 1. Security Check (IDOR Protection)
    const isSuperAdmin = user.role === Detso_Role.SAAS_SUPER_ADMIN || user.role === Detso_Role.TENANT_OWNER;

    // Jika bukan super admin, dia HANYA boleh lihat tenant ID miliknya sendiri
    if (!isSuperAdmin && user.tenantId !== tenantIdParam) {
        // Return Not Found agar attacker tidak tahu kalau ID itu sebenarnya ada
        throw new NotFoundError('Tenant tidak ditemukan');
    }

    // 2. Get Data
    const tenant = await prisma.detso_Tenant.findFirst({
        where: {
            id: tenantIdParam,
            deleted_at: null
        },
        // Opsional: Include detail lengkap jika Super Admin yang buka
        include: {
            _count: {
                select: {
                    users: true,
                    customers: true,
                    packages: true
                }
            }
        }
    });

    if (!tenant) {
        throw new NotFoundError('Tenant tidak ditemukan');
    }

    const formattedTenant = {
        ...tenant,
        logo: tenant.logo ? `${baseUrl}/${tenant.logo}` : null
    };


    responseData(res, 200, 'Detail Tenant berhasil diambil', formattedTenant);
});

export const getTenantLogo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Ambil Context User
    const user = req.user;
    if (!user) throw new AuthenticationError('Sesi tidak valid');

    const tenantIdParam = req.params.id;
    const isSuperAdmin = user.role === Detso_Role.SAAS_SUPER_ADMIN;

    // 2. Security Check: Isolasi Data
    // User biasa HANYA boleh ambil logo tenantnya sendiri
    if (!isSuperAdmin && user.tenantId !== tenantIdParam) {
        throw new NotFoundError('Logo tidak ditemukan'); // Return 404 agar aman
    }

    // 3. Ambil Path dari Database
    const tenant = await prisma.detso_Tenant.findUnique({
        where: { id: tenantIdParam },
        select: { logo: true }
    });

    if (!tenant) {
        throw new NotFoundError('Tenant tidak ditemukan');
    }

    // 4. Construct Full URL

    let logoUrl = null;

    if (tenant.logo) {
        // Normalisasi path (ubah backslash Windows '\' jadi slash biasa '/')
        const cleanPath = tenant.logo.replace(/\\/g, '/');

        // Pastikan tidak ada double slash saat digabung
        // Asumsi: tenant.logo di DB formatnya "storage/image/..."
        logoUrl = `${baseUrl}/${cleanPath}`;
    }

    // 5. Kirim Response JSON
    responseData(res, 200, 'URL Logo berhasil diambil', {
        logo_url: logoUrl
    });
});