import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';

export const deleteServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const serviceId = req.params.id;

  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
  const isAssignedTechnician = req.user?.role === 'TEKNISI' && 
    await prisma.detso_Service_Connection.findFirst({
      where: { 
        id: serviceId,
      }
    });

  if (!isAdmin && !isAssignedTechnician) {
    throw new AuthorizationError('Anda tidak memiliki izin untuk menghapus service connection ini');
  }

  // Cari service connection dengan foto-fotonya
  const serviceConnection = await prisma.detso_Service_Connection.findUnique({
    where: { 
      id: serviceId,
      deleted_at: null 
    },
    include: {
      photos: true
    }
  });

  if (!serviceConnection) {
    throw new NotFoundError('Service connection tidak ditemukan atau sudah dihapus');
  }

  const filesToDelete = serviceConnection.photos
    .filter(photo => photo.photo_url)
    .map(photo => photo.photo_url);

  console.log('Files to delete:', filesToDelete);

  const [deletedService] = await prisma.$transaction([
    prisma.detso_Service_Connection.update({
      where: { id: serviceId },
      data: { deleted_at: new Date() }
    }),
    
    prisma.detso_Service_Photo.deleteMany({
      where: { service_id: serviceId },
    })
  ]);

  await Promise.all(filesToDelete.map(async filePath => {
    try {
      await deleteFile(filePath);
      console.log(`Berhasil hapus file: ${filePath}`);
    } catch (err) {
      console.error(`Gagal hapus file ${filePath}:`, err);
    }
  }));

  responseData(res, 200, 'Service connection berhasil dihapus', {
    serviceId: deletedService.id,
    deletedFiles: filesToDelete.length,
    details: {
      photos: serviceConnection.photos.length
    }
  });
});