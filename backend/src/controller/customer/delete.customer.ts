import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';

export const deleteCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customerId = req.params.id;

  const isAdmin = req.user?.role === 'TENANT_ADMIN' || req.user?.role === 'TENANT_OWNER' || req.user?.role === 'SAAS_SUPER_ADMIN';
  if (!isAdmin) {
    throw new AuthorizationError('Hanya admin yang dapat menghapus customer');
  }

  const customer = await prisma.detso_Customer.findUnique({
    where: { id: customerId, deleted_at: null },
    include: {
      documents: true,
      service: {
        include: {
          photos: true
        }
      }
    }
  });

  if (!customer) {
    throw new NotFoundError('Customer tidak ditemukan');
  }

  // Kumpulkan semua file yang perlu dihapus
  const filesToDelete: string[] = [];

  // 1. Tambahkan dokumen customer
  customer.documents.forEach(doc => {
    if (doc.document_url) {
      filesToDelete.push(doc.document_url);
    }
  });

  // 2. Tambahkan foto dari semua service connections
  console.log('Customer service photos:', customer.service.flatMap(s => s.photos));
  customer.service.forEach((service) => {
    service.photos.forEach(photo => {
      if (photo.photo_url) {
        filesToDelete.push(photo.photo_url);
      }
    });
  });

  console.log('Files to delete:', filesToDelete);

  // Lakukan soft delete transaction
  const [deletedCustomer] = await prisma.$transaction([
    prisma.detso_Customer.update({
      where: { id: customerId },
      data: { deleted_at: new Date() }
    }),
    prisma.detso_Service_Connection.updateMany({
      where: { customer_id: customerId },
      data: { deleted_at: new Date() }
    }),
    prisma.detso_Customer_Document.deleteMany({
      where: { customer_id: customerId }
    }),
    prisma.detso_Service_Photo.deleteMany({
      where: {
        service: {
          customer_id: customerId
        }
      }
    })
  ]);

  // Hapus file fisik
  await Promise.all(filesToDelete.map(async filePath => {
    try {
      await deleteFile(filePath);
      console.log(`Berhasil hapus file: ${filePath}`);
    } catch (err) {
      console.error(`Gagal hapus file ${filePath}:`, err);
    }
  }));

  responseData(res, 200, 'Customer berhasil dihapus', {
    deletedFiles: filesToDelete.length,
    details: {
      documents: customer.documents.length,
      photos: customer.service.flatMap(s => s.photos).length
    }
  });
});