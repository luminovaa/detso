import { Request, Response } from 'express'
import { asyncHandler, AuthorizationError, ValidationError, NotFoundError, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { createPackageSchema } from './validation/validation.package' 
import { prisma } from '../../utils/prisma'
import { Detso_Role } from '@prisma/client'

export const editPackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id dan Validasi Session
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    // [NEW] 2. Cek Role (Gunakan Role SaaS)
    if (user.role !== Detso_Role.TENANT_OWNER && user.role !== Detso_Role.TENANT_ADMIN) {
        throw new AuthorizationError('Anda tidak memiliki izin untuk mengedit paket');
    }

    const packageId  = req.params.id;
 
    // Gunakan schema validasi (bisa createPackageSchema atau updatePackageSchema tergantung kebutuhan partial update)
    const validationResult = createPackageSchema.safeParse(req.body)
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors)
    }

    const { name, speed, price } = validationResult.data

    // [NEW] 3. Cek keberadaan paket DENGAN filter tenant_id
    // Menggunakan findFirst agar kita bisa menyisipkan tenant_id
    const existingPackage = await prisma.detso_Package.findFirst({
        where: { 
            id: packageId,
            tenant_id: tenantId // <--- KUNCI: Pastikan paket milik tenant ini
        }
    })

    if (!existingPackage) {
        // Jika ID ada tapi milik tenant lain, tetap return NotFound demi keamanan
        throw new NotFoundError('Paket tidak ditemukan')
    }

    // [NEW] 4. Cek Duplikasi Nama (Jika nama berubah)
    // Kita harus memastikan nama baru belum dipakai oleh paket LAIN di tenant ini
    if (name !== existingPackage.name) {
        const duplicateParams = await prisma.detso_Package.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                tenant_id: tenantId, // Cek di tenant ini saja
                id: { not: packageId }, // Jangan hitung diri sendiri
                deleted_at: null
            }
        });

        if (duplicateParams) {
            throw new ValidationError(`Nama paket "${name}" sudah digunakan oleh paket lain.`);
        }
    }

    const updatedPackage = await prisma.detso_Package.update({
        where: { id: packageId },
        data: {
            name,
            speed,
            price: price ?? 0,
            updated_at: new Date()
        }
    })

    responseData(res, 200, 'Paket berhasil diperbarui', updatedPackage)
})