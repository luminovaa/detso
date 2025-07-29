import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.detso_User.findUnique({
    where: {
      id: id,
      deleted_at: null
    }
  });

  if (!user) {
  throw new NotFoundError('User tidak ditemukan atau sudah dihapus');
  }

  if (user.id === req.user?.id) {
    throw new AuthorizationError('Anda tidak dapat menghapus akun Anda sendiri');
  }

  await prisma.detso_User.update({
    where: { id: id },
    data: {
      deleted_at: new Date()
    }
  });

  await prisma.detso_Refresh_Token.updateMany({
    where: { user_id: id },
    data: {
      is_active: false,
      revoked_at: new Date()
    }
  });

  responseData(res, 200, 'User berhasil dihapus (soft delete)', {
    id: user.id,
    email: user.email,
    deletedAt: new Date()
  });
});