import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';

export const deletePackage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const packageId = req.params.id;

  const packageData = await prisma.detso_Package.findUnique({
    where: {
      id: packageId,
      deleted_at: null
    }
  });

  if (!packageData) {
  throw new NotFoundError('Paket tidak ditemukan atau sudah dihapus');
  }

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