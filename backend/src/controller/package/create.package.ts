import { Request, Response } from 'express'
import { asyncHandler, AuthorizationError, ValidationError, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { createPackageSchema } from './validation/validation.package'
import { prisma } from '../../utils/prisma'
import { Detso_Role } from '@prisma/client' // Import Enum Role

export const createPackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id & Cek Session
    const user = req.user;
    if (!user || !user.tenantId) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenantId;

    // [NEW] 2. Cek Role (Gunakan Role Baru SaaS)
    // Hanya Owner dan Admin Tenant yang boleh buat paket. Teknisi tidak boleh.
    // Cek secara eksplisit untuk menghindari masalah tipe pada includes()
    if (user.role !== Detso_Role.TENANT_OWNER && user.role !== Detso_Role.TENANT_ADMIN) {
        throw new AuthorizationError('Anda tidak memiliki izin untuk membuat paket');
    }

    const validationResult = createPackageSchema.safeParse(req.body)

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors)
    }
    
    const { name, speed, price } = validationResult.data

    // [NEW] 3. Cek Duplikasi Nama Paket (Hanya di dalam Tenant ini)
    // ISP A boleh punya "Paket Gold", ISP B juga boleh punya "Paket Gold".
    // Tapi ISP A tidak boleh punya dua "Paket Gold".
    const existingPackage = await prisma.detso_Package.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' }, // Cek case-insensitive
            tenant_id: tenantId, // Filter tenant
            deleted_at: null
        }
    });

    if (existingPackage) {
        throw new ValidationError(`Paket dengan nama "${name}" sudah ada di sistem Anda.`);
    }

    // [NEW] 4. Create dengan tenant_id
    const packageData = await prisma.detso_Package.create({
        data: {
            tenant_id: tenantId, // Link ke tenant
            name,
            speed,
            price: price ? price : 0,
            created_at: new Date()
        }
    })

    responseData(res, 201, 'Paket berhasil dibuat', packageData)
})