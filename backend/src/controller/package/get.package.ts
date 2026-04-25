import { Request, Response } from 'express'
// [UPDATED] Jangan new PrismaClient() lagi, import dari utils
import { prisma } from '../../utils/prisma'
import { paginationSchema } from './validation/validation.package'
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { getPagination } from '../../utils/pagination'

export const getAllPackages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id untuk filter
  const user = req.user;
  if (!user || !user.tenant_id) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenant_id = user.tenant_id;

  const validationResult = paginationSchema.safeParse(req.query)

  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const { page, limit, search } = validationResult.data

  // [NEW] 2. Buat Where Clause dengan tenant_id dan search
  const whereClause: any = {
      tenant_id: tenant_id, // <--- Filter WAJIB
      deleted_at: null
  };

  // [NEW] 3. Tambahkan search filter jika ada
  if (search && search.trim()) {
    const searchTerm = search.trim();
    
    // Build OR conditions untuk setiap field yang bisa dicari
    whereClause.OR = [
      {
        name: {
          contains: searchTerm,
          mode: 'insensitive' 
        }
      },
      {
        // Untuk speed: cari yang dimulai dengan angka tersebut
        // Contoh: "50" akan match "50 Mbps", "50Mbps", "50"
        // Tapi TIDAK akan match "150 Mbps", "500 Mbps"
        speed: {
          startsWith: searchTerm,
          mode: 'insensitive' 
        }
      },
    ];
  }

  // Hitung total hanya milik tenant ini
  const totalPackages = await prisma.detso_Package.count({
    where: whereClause
  })

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems: totalPackages
  })

  // Ambil data hanya milik tenant ini
  const packages = await prisma.detso_Package.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
        created_at: 'desc' // Opsional: Urutkan biar rapi
    }
  })

  responseData(res, 200, 'Daftar Paket berhasil diambil', {
    packages,
    pagination
  })
})

export const getPackageById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenant_id = user.tenant_id;

  const packageId = req.params.id;

  // [NEW] 2. Cari paket dengan ID tersebut DAN tenant_id tersebut
  const packageData = await prisma.detso_Package.findFirst({
    where: {
      id: packageId,
      tenant_id: tenant_id, // <--- Security Check: Pastikan milik ISP yang login
      deleted_at: null,
    },
  });

  if (!packageData) {
    // Jika ID benar tapi tenant salah, tetap return NotFound (jangan bocorkan info)
    throw new NotFoundError('Paket tidak ditemukan');
  }

  responseData(res, 200, 'Data paket berhasil diambil', packageData );
});