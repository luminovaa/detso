import { Request, Response } from 'express'
import { asyncHandler, AuthorizationError, ValidationError, NotFoundError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { createPackageSchema } from './validation/validation.package' 
import { prisma } from '../../utils/prisma'

export const editPackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN'
    if (!isAdmin) {
        throw new AuthorizationError('Hanya admin yang dapat mengedit paket')
    }

    const packageId  = req.params.id
 
    const validationResult = createPackageSchema.safeParse(req.body)
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors)
    }

    const { name, speed, price } = validationResult.data

    const existingPackage = await prisma.detso_Package.findUnique({
        where: { id: packageId }
    })

    if (!existingPackage) {
        throw new NotFoundError('Paket tidak ditemukan')
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