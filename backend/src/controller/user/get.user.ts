import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { paginationSchema, userIdSchema } from './validation/validation.user'
import { asyncHandler, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'

const prisma = new PrismaClient()

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = paginationSchema.safeParse(req.query)

  if (!validationResult.success) {
  throw new ValidationError('Validasi gagal', validationResult.error.format());
  }

  const { page, limit } = validationResult.data

  const totalUsers = await prisma.user.count({
    where: {
      isDeleted: false
    }
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalUsers
  })

  const users = await prisma.user.findMany({
    where: {
      isDeleted: false
    },
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      profile: {
        select: { id: true, name: true, bio: true, photoUrl: true }
      }
    }
  })

  responseData(res, 200, 'Daftar pengguna berhasil diambil', {
    users,
    pagination
  })
})

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = userIdSchema.safeParse(req.params);

  if (!validationResult.success) {
    responseData(res, 400, 'Validasi Gagal', validationResult.error.format());
    return;
  }

  const { id } = validationResult.data;

  const user = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      profile: {
        select: {
          id: true,
          name: true,
          bio: true,
          photoUrl: true,
        },
      },
    },
  });

  if (!user) {
    responseData(res, 404, 'Pengguna tidak ditemukan atau telah dihapus', null);
    return;
  }

  responseData(res, 200, 'Data pengguna berhasil diambil', user );
});

export const getPhotoUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = userIdSchema.safeParse(req.params);

  if (!validationResult.success) {
    responseData(res, 400, 'Validasi Gagal', validationResult.error.format());
    return;
  }

  const { id } = validationResult.data;

  const user = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      profile: {
        select: {
          photoUrl: true,
        },
      },
    },
  });

  if (!user || !user.profile?.photoUrl) {
    responseData(res, 404, 'Foto pengguna tidak ditemukan', null);
    return;
  }

  responseData(res, 200, 'Foto pengguna berhasil diambil',
    user.profile.photoUrl,
  );
});