import { Request, Response } from 'express';
import { asyncHandler, AuthorizationError, NotFoundError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { Detso_Role } from '@prisma/client';

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id dan Role User yang login
  const currentUser = req.user;
  
  const tenantId = currentUser?.tenant_id;
  const myRole = currentUser?.role as Detso_Role;

  // [NEW] 2. Cek Izin Dasar (Hanya Owner & Admin yang boleh hapus user)
  if (myRole !== Detso_Role.TENANT_OWNER && myRole !== Detso_Role.TENANT_ADMIN) {
      throw new AuthorizationError('Anda tidak memiliki izin untuk menghapus pengguna');
  }

  const { id } = req.params;

  // [NEW] 3. Cari Target User dengan Filter Tenant
  const targetUser = await prisma.detso_User.findFirst({
    where: {
      id: id,
      tenant_id: tenantId, // <--- Filter WAJIB: Pastikan target satu perusahaan
      deleted_at: null
    }
  });

  if (!targetUser) {
    throw new NotFoundError('User tidak ditemukan atau sudah dihapus');
  }

  // 4. Validasi Self-Delete
  if (targetUser.id === currentUser?.id) {
    throw new AuthorizationError('Anda tidak dapat menghapus akun Anda sendiri');
  }

  // [NEW] 5. Validasi Hirarki (PENTING!)
  // Admin tidak boleh menghapus Owner.
  // Owner boleh menghapus Admin & Teknisi.
  if (myRole === Detso_Role.TENANT_ADMIN && targetUser.role === Detso_Role.TENANT_OWNER) {
      throw new AuthorizationError('Admin tidak memiliki wewenang untuk menghapus Owner');
  }

  // Transaction: Soft delete user & Revoke sessions
  await prisma.$transaction([
    prisma.detso_User.update({
      where: { id: id },
      data: {
        deleted_at: new Date()
      }
    }),
    prisma.detso_Refresh_Token.updateMany({
      where: { user_id: id },
      data: {
        is_active: false,
        revoked_at: new Date()
      }
    })
  ]);

  responseData(res, 200, 'User berhasil dihapus (soft delete)', {
    id: targetUser.id,
    email: targetUser.email,
    username: targetUser.username,
    role: targetUser.role,
    deletedAt: new Date()
  });
});