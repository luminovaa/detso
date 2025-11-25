import { Request, Response } from 'express'
import { paginationSchema } from './validation/validation.user'
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'
import { prisma } from '../../utils/prisma'
import { Detso_Role } from '@prisma/client' // [NEW] Import Enum

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUser = req.user;
  
  // Validasi Query Params (tambahkan tenant_id opsional untuk filter admin)
  const validationResult = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role,
  })

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors)
  }

  const { page, limit, search, role } = validationResult.data
  
  // Jika Super Admin ingin filter spesifik tenant via query param (opsional)
  const filterTenantId = req.query.tenant_id as string; 

  // [UPDATED] LOGIC PEMBAGIAN AKSES
  const condition: any = {
    deleted_at: null
  }

  if (currentUser?.role === Detso_Role.SAAS_SUPER_ADMIN) {
      // --- LOGIC SUPER ADMIN ---
      // Jika Super Admin mengirim ?tenant_id=..., kita filter. 
      // Jika tidak, biarkan kosong agar SEMUA user dari SEMUA tenant muncul.
      if (filterTenantId) {
          condition.tenant_id = filterTenantId;
      }
      // else: condition.tenant_id tetap undefined -> Prisma ambil semua data
  } else {
      // --- LOGIC TENANT STAFF ---
      // WAJIB terkunci di tenant sendiri
      if (!currentUser?.tenant_id) {
          throw new AuthenticationError('Sesi tidak valid: Tenant ID hilang');
      }
      condition.tenant_id = currentUser.tenant_id;
  }

  // Filter Role
  if (role) {
    condition.role = role
  }

  // Filter Search
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
      tenant_id: true, // [OPSIONAL] Tampilkan ini agar Super Admin tahu user ini milik siapa
      profile: {
        select: {
          id: true,
          full_name: true,
          avatar: true 
        }
      },
      // Tambahkan info tenant name agar Super Admin tidak bingung (hanya jika ada relasi)
      tenant: {
        select: {
            name: true 
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
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
  // [NEW] 1. Ambil tenant_id
  const currentUser = req.user;
 
  const tenantId = currentUser?.tenant_id;

  const { id } = req.params;

  // [NEW] 2. Cari User dengan ID + Tenant ID
  // Menggunakan findFirst untuk memastikan user target berada di tenant yang sama
  const user = await prisma.detso_User.findFirst({
    where: {
      id,
      tenant_id: tenantId, // <--- Security Check
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
    // Jika user tidak ada ATAU beda tenant, return Not Found
    throw new NotFoundError('Pengguna tidak ditemukan atau telah dihapus');
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
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
  // [NEW] 1. Ambil tenant_id
  const currentUser = req.user;
  if (!currentUser || !currentUser.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid');
  }
  const tenantId = currentUser.tenant_id;

  const { id } = req.params;

  // [NEW] 2. Validasi Kepemilikan User
  const user = await prisma.detso_User.findFirst({
    where: {
      id,
      tenant_id: tenantId, // <--- Security Check
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

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const photoUrl = `${baseUrl}/${user.profile.avatar}`;

  responseData(res, 200, 'Foto pengguna berhasil diambil', {
    avatar: photoUrl
  });
});