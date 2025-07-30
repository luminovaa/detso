import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { paginationSchema } from './validation/validation.package'
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'

const prisma = new PrismaClient()

export const getAllPackages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = paginationSchema.safeParse(req.query)

  if (!validationResult.success) {
  throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { page, limit } = validationResult.data

  const totalPackages = await prisma.detso_Package.count({
    where: {
      deleted_at: null
    }
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalPackages
  })

  const packages = await prisma.detso_Package.findMany({
    where: {
      deleted_at: null
    },
    skip,
    take: limit,
  })

  responseData(res, 200, 'Daftar Paket berhasil diambil', {
    packages,
    pagination
  })
})


export const getPackageById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const packageId = req.params.id;

  const packageData = await prisma.detso_Package.findFirst({
    where: {
      id: packageId,
      deleted_at: null,
    },
  });

  if (!packageData) {
    throw new NotFoundError('Pengguna tidak ditemukan atau telah dihapus');
  }

  responseData(res, 200, 'Data pengguna berhasil diambil', packageData );
});
