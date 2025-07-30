import { Request, Response } from 'express'
import { asyncHandler, AuthorizationError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { createPackageSchema } from './validation/validation.package'
import { prisma } from '../../utils/prisma'

export const createPackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN'
    if (!isAdmin) {
        throw new AuthorizationError('Hanya admin yang dapat membuat paket')
    }
    const validationResult = createPackageSchema.safeParse(req.body)


    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors)
    }
    const { name, speed, price } = validationResult.data

    const packageData = await prisma.detso_Package.create({
        data: {
            name,
            speed,
            price: price ? price : 0,
            created_at: new Date()
        }
    })

    responseData(res, 201, 'Paket berhasil dibuat', packageData)
})