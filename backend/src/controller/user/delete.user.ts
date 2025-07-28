import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { cloudinary } from '../../../config/cloudinary'

const prisma = new PrismaClient();

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const currentUser = req.user;
    const isAdmin = currentUser?.role === 'ADMIN';

    const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            profile: {
                select: {
                    publicPhotoId: true
                }
            }
        }
    });

    if (!userToDelete) {
        responseData(res, 404, 'Pengguna tidak ditemukan');
        return;
    }

    if (!isAdmin && currentUser?.id !== userId) {
        responseData(res, 403, 'Anda tidak memiliki izin untuk menghapus pengguna ini');
        return;
    }

    if (userToDelete.profile?.publicPhotoId) {
        try {
            await cloudinary.uploader.destroy(userToDelete.profile.publicPhotoId);
        } catch (error) {
            console.error('Gagal menghapus foto dari Cloudinary:', error);
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            email: `deleted_${Date.now()}_${userToDelete.id}`,
            username: `deleted_${Date.now()}_${userToDelete.id}`,
            password: '',
            isDeleted: true
        }
    })

    responseData(res, 200, 'Pengguna berhasil dihapus (soft delete)');
});