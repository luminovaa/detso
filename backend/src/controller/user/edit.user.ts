import { Request, Response } from 'express';
import { updatePasswordSchema, updateUserSchema } from './validation/validation.user';
import { asyncHandler, AuthenticationError, AuthorizationError, FileUploadError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import bcrypt from 'bcryptjs';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { prisma } from '../../utils/prisma';


export const editUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const currentUser = req.user;
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';

    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err =>
                console.error('Gagal menghapus file:', err)
            );
        }
    };

    // Cek apakah user exists
    const userExists = await prisma.detso_User.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
                select: { avatar: true }
            }
        }
    });

    if (!userExists) {
        await cleanupUploadedFile();
        throw new NotFoundError('Pengguna tidak ditemukan');
    }

    if (!isAdmin && currentUser?.id !== userId) {
        await cleanupUploadedFile();
        throw new AuthorizationError('Anda tidak memiliki izin untuk mengedit pengguna ini');
    }

    let uploadedPhoto: { path: string; fileName: string; fullPath: string } | undefined;
    if (req.file) {
        uploadedPhoto = getUploadedFileInfo(req.file, 'image/profile');
    }

    const validationResult = updateUserSchema.safeParse({
        ...req.body,
        avatar: uploadedPhoto?.path
    });

    if (!validationResult.success) {
        await cleanupUploadedFile();
        throw new ValidationError('Validasi Gagal', validationResult.error.errors);
    }

    const { email, username, role, full_name, avatar } = validationResult.data;

    if (uploadedPhoto && userExists.profile?.avatar) {
        await deleteFile(userExists.profile.avatar).catch(error =>
            console.error('Gagal menghapus file lama:', error)
        );
    }

    const [updatedUser, updatedProfile] = await prisma.$transaction([
        prisma.detso_User.update({
            where: { id: userId },
            data: {
                email,
                username,
                role: isAdmin ? role : userExists.role,
                updated_at: new Date()
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                profile: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar: true
                    }
                }
            }
        }),
        prisma.detso_Profile.update({
            where: { user_id: userId },
            data: {
                full_name,
                avatar,
                updated_at: new Date()
            },
            select: {
                id: true,
                full_name: true,
                avatar: true
            }
        })
    ]);

    responseData(res, 200, 'Data pengguna berhasil diperbarui', {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        profile: {
            id: updatedProfile.id,
            full_name: updatedProfile.full_name,
            avatar: updatedProfile.avatar
        }
    });
});

export const editUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const currentUser = req.user;

    const isAdmin = currentUser?.role === 'ADMIN';

    const validationResult = updatePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ValidationError('Validasi Gagal', validationResult.error.errors);
    }

    const { oldPassword, password } = validationResult.data

    const user = await prisma.detso_User.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
    })

    if (!user) {
        throw new NotFoundError('Pengguna tidak ditemukan');
    }

    if (!isAdmin && currentUser?.id !== userId) {
        throw new AuthorizationError('Anda tidak memliki izin untuk mengubah password pengguna ini');
    }

    if (!isAdmin) {
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new AuthenticationError('Password lama salah');
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.detso_User.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    responseData(res, 200, 'Password berhasil diperbarui')
})