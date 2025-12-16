import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';
import { Detso_Role } from '@prisma/client';

export const deleteServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id
  const user = req.user;
  if (!user || !user.tenantId) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenantId = user.tenantId;

  // [NEW] 2. Cek Role (Hanya Owner & Admin)
  if (user.role !== Detso_Role.TENANT_OWNER && user.role !== Detso_Role.TENANT_ADMIN) {
      throw new AuthorizationError('Anda tidak memiliki izin untuk menghapus layanan ini');
  }

  const serviceId = req.params.id;

  // [NEW] 3. Cari Service dengan Filter Tenant (Mencegah Hapus Punya Orang Lain)
  const serviceConnection = await prisma.detso_Service_Connection.findFirst({
    where: { 
      id: serviceId,
      tenant_id: tenantId, // <--- Filter WAJIB
      deleted_at: null 
    },
    include: {
      photos: true,
      customer: true
    }
  });

  if (!serviceConnection) {
    throw new NotFoundError('Service connection tidak ditemukan atau sudah dihapus');
  }

  const customerId = serviceConnection.customer_id;

  // Kumpulkan file fisik yang mau dihapus
  const filesToDelete = serviceConnection.photos
    .filter(photo => photo.photo_url)
    .map(photo => photo.photo_url);

  // [NEW] 4. Transaction: Soft Delete Service & Hard Delete Photos
  // Kita gunakan updateMany untuk Service agar bisa menyertakan tenant_id sebagai safety net tambahan
  await prisma.$transaction([
    prisma.detso_Service_Connection.updateMany({
      where: { 
          id: serviceId,
          tenant_id: tenantId // Double check
      },
      data: { deleted_at: new Date() }
    }),
    prisma.detso_Service_Photo.deleteMany({
      where: { service_id: serviceId }
    })
  ]);

  // [NEW] 5. Cek Sisa Layanan Aktif (Scoped per Tenant)
  // Hitung apakah customer ini masih punya layanan lain DI TENANT INI?
  const activeServiceCount = await prisma.detso_Service_Connection.count({
    where: {
      customer_id: customerId,
      tenant_id: tenantId, // <--- Filter WAJIB
      deleted_at: null
    }
  });

  let customerDeleted = false;
  
  // Jika tidak ada layanan tersisa di tenant ini, soft delete customer
  if (activeServiceCount === 0) {
    // Kita gunakan updateMany lagi untuk safety net tenant_id
    await prisma.detso_Customer.updateMany({
      where: { 
          id: customerId,
          tenant_id: tenantId 
      },
      data: { deleted_at: new Date() }
    });
    customerDeleted = true;
  }

  // Hapus file fisik secara async (di luar transaction DB agar tidak blocking lama)
  await Promise.all(
    filesToDelete.map(async (filePath) => {
      try {
        await deleteFile(filePath);
      } catch (err) {
        console.error(`Gagal hapus file ${filePath}:`, err);
      }
    })
  );

  responseData(res, 200, 'Service connection berhasil dihapus', {
    serviceId: serviceId,
    deletedFiles: filesToDelete.length,
    customerDeleted: customerDeleted,
    details: {
      photos: serviceConnection.photos.length,
      remainingActiveServices: activeServiceCount
    }
  });
});