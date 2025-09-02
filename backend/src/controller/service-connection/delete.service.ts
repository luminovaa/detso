import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';

export const deleteServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const serviceId = req.params.id;

  const serviceConnection = await prisma.detso_Service_Connection.findUnique({
    where: { 
      id: serviceId,
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

  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    throw new AuthorizationError('Anda tidak memiliki izin untuk menghapus service connection ini');
  }

  const filesToDelete = serviceConnection.photos
    .filter(photo => photo.photo_url)
    .map(photo => photo.photo_url);

  console.log('Files to delete:', filesToDelete);

  await prisma.$transaction([
    prisma.detso_Service_Connection.update({
      where: { id: serviceId },
      data: { deleted_at: new Date() }
    }),
    prisma.detso_Service_Photo.deleteMany({
      where: { service_id: serviceId }
    })
  ]);

  const activeServiceCount = await prisma.detso_Service_Connection.count({
    where: {
      customer_id: customerId,
      deleted_at: null
    }
  });

  let customerDeleted = false;
  if (activeServiceCount === 0) {
    await prisma.detso_Customer.update({
      where: { id: customerId },
      data: { deleted_at: new Date() }
    });
    customerDeleted = true;
  }

  await Promise.all(
    filesToDelete.map(async (filePath) => {
      try {
        await deleteFile(filePath);
        console.log(`Berhasil hapus file: ${filePath}`);
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