import { Request, Response } from 'express'
import { paginationSchema } from './validation/validation.user'
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'
import { prisma } from '../../utils/prisma'


export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role
  })

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors)
  }

  const { page, limit, search, role } = validationResult.data

  const condition: any = {
    deleted_at: null
  }

  if (role) {
    condition.role = role
  }

  if (search) {
    condition.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { full_name: { contains: search, mode: 'insensitive' } } },
      { phone: { contains: search, mode: 'insensitive' } }
    ]
  }

  const totalUsers = await prisma.detso_User.count({
    where: condition
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalUsers
  })

  const users = await prisma.detso_User.findMany({
    where: condition,
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      profile: {
        select: {
          id: true,
          full_name: true,
          avatar: true 
        }
      },
    }
  })

  const baseUrl = process.env.BASE_URL
  const usersWithAvatarUrl = users.map(user => ({
    ...user,
    profile: user.profile
      ? {
        ...user.profile,
        avatar: user.profile.avatar ? `${baseUrl}/${user.profile.avatar}` : null
      }
      : null
  }))

  responseData(res, 200, 'Daftar pengguna berhasil diambil', {
    users: usersWithAvatarUrl,
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
      phone: true,
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

  const baseUrl = process.env.BASE_URL;
  const userWithAvatarUrl = {
    ...user,
    profile: user.profile
      ? {
        ...user.profile,
        avatar: user.profile.avatar ? `${baseUrl}/${user.profile.avatar}` : null,
      }
      : null,
  };

  responseData(res, 200, 'Data pengguna berhasil diambil', userWithAvatarUrl);
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