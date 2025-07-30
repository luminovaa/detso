import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { paginationSchema } from './validation/validation.user'
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'

const prisma = new PrismaClient()

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = paginationSchema.safeParse(req.query)

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { page, limit } = validationResult.data

  const totalUsers = await prisma.detso_User.count({
    where: {
      deleted_at: null
    }
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalUsers
  })

  const users = await prisma.detso_User.findMany({
    where: {
      deleted_at: null
    },
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      profile: {
        select: { id: true, full_name: true, avatar: true }
      }
    }
  })

  responseData(res, 200, 'Daftar pengguna berhasil diambil', {
    users,
    pagination
  })
})

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {


  const { id } = req.params;

  const user = await prisma.detso_User.findFirst({
    where: {
      id,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      profile: {
        select: {
          id: true,
          full_name: true,
          avatar: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('Pengguna tidak ditemukan atau telah dihapus');
  }

  responseData(res, 200, 'Data pengguna berhasil diambil', user);
});

export const getPhotoUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.detso_User.findFirst({
    where: {
      id,
      deleted_at: null,
    },
    select: {
      profile: {
        select: {
          avatar: true,
        },
      },
    },
  });

  if (!user || !user.profile?.avatar) {
    throw new NotFoundError('Foto pengguna tidak ditemukan atau telah dihapus');
  }

  const baseUrl = process.env.BASE_URL;
  const photoUrl = `${baseUrl}/${user.profile.avatar}`;

  responseData(res, 200, 'Foto pengguna berhasil diambil', {
    avatar: photoUrl
  });
});