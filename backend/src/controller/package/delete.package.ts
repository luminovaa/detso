import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { Detso_Role } from '@prisma/client';

export const deletePackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id dan Validasi Session
  const user = req.user;
  if (!user || !user.tenantId) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenantId = user.tenantId;

  const packageId = req.params.id;

  // [NEW] 3. Cari paket dengan filter tenant_id
  // Gunakan findFirst untuk kombinasi ID + TenantID
  const packageData = await prisma.detso_Package.findFirst({
    where: {
      id: packageId,
      tenant_id: tenantId, // <--- KUNCI KEAMANAN: Pastikan milik ISP yang login
      deleted_at: null
    }
  });

  if (!packageData) {
    // Jika paket tidak ditemukan ATAU milik tenant lain, return NotFound
    throw new NotFoundError('Paket tidak ditemukan atau sudah dihapus');
  }

  // [NEW] 4. Lakukan Soft Delete
  // Kita aman menggunakan update({ where: { id } }) di sini karena
  // kita sudah memverifikasi kepemilikan ID tersebut di langkah nomor 3.
  await prisma.detso_Package.update({
    where: { id: packageId },
    data: {
      deleted_at: new Date()
    }
  });

  responseData(res, 200, 'Paket berhasil dihapus (soft delete)', {
    id: packageData.id,
    name: packageData.name,
    deletedAt: new Date()
  });
});