import { Request, Response } from 'express';
import { asyncHandler, AuthenticationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile } from '../../config/upload-file';
import { getParam } from '../../utils/request.utils';

export const deleteSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const id = getParam(req.params.id);

  const existingSchedule = await prisma.detso_Work_Schedule.findFirst({
    where: {
      id,
      tenant_id: user.tenant_id,
    },
  });

  if (!existingSchedule) {
    throw new NotFoundError('Jadwal tidak ditemukan atau akses ditolak');
  }

  await prisma.detso_Work_Schedule.delete({
    where: { id },
  });

  if (existingSchedule.image) {
    await deleteFile(existingSchedule.image).catch((err) =>
      console.error('Gagal menghapus file foto jadwal:', err),
    );
  }

  responseData(res, 200, 'Jadwal berhasil dihapus', { id });
});
