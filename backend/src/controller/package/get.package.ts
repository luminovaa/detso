import { Request, Response } from 'express'
import { paginationSchema, packageIdSchema } from './validation/validation.pacakage'
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'
import { prisma } from '../../utils/prisma'


export const getAllPackages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = paginationSchema.safeParse(req.query)

  if (!validationResult.success) {
  throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { page, limit } = validationResult.data

  const totalPackage = await prisma.detso_Package.count({
    where: {
      deleted_at: null
    }
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalPackage
  })

  const packages = await prisma.detso_Package.findMany({
    where: {
      deleted_at: null
    },
    skip,
    take: limit,
  })

  responseData(res, 200, 'Daftar paket berhasil diambil', {
    packages,
    pagination
  })
})

export const getPackageById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = packageIdSchema.safeParse(req.params);

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { id } = validationResult.data;

  const packageData = await prisma.detso_Package.findFirst({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (!packageData) {
    throw new NotFoundError('Paket tidak ditemukan atau telah dihapus');
  }

  responseData(res, 200, 'Data paket berhasil diambil', packageData );
});