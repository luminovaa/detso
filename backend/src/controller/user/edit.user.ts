import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { updatePasswordSchema, updateUserSchema } from './validation/validation.user';
import { asyncHandler, AuthenticationError, AuthorizationError, FileUploadError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import bcrypt from 'bcryptjs';
import { deleteFile, uploadFile } from '../../utils/upload-file';

const prisma = new PrismaClient();

export const editUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const currentUser = req.user;
        const isAdmin = currentUser?.role === 'SUPER_ADMIN';

        // Upload file jika ada
        let uploadedPhoto;
        try {
            if (req.files?.photo) {
                uploadedPhoto = await uploadFile(req, {
                    fieldName: 'photo',
                    destination: 'image/profile',
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
                    maxFileSize: 5 * 1024 * 1024 // 5MB
                });
            }
        } catch (uploadError) {
            throw new FileUploadError('Gagal mengupload file');
        }

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
            if (uploadedPhoto) await deleteFile(uploadedPhoto.path);
            throw new NotFoundError('Pengguna tidak ditemukan');
        }

        if (!isAdmin && currentUser?.id !== userId) {
            if (uploadedPhoto) await deleteFile(uploadedPhoto.path);
            throw new AuthorizationError('Anda tidak memliki izin untuk mengedit pengguna ini');
        }

        const validationResult = updateUserSchema.safeParse({
            ...req.body,
            photoUrl: uploadedPhoto?.path
        });

        if (!validationResult.success) {
            if (uploadedPhoto) await deleteFile(uploadedPhoto.path);
            throw new ValidationError('Validasi Gagal', validationResult.error.errors);
        }

        const { email, username, role, full_name, avatar } = validationResult.data;

        // Hapus foto lama jika ada foto baru yang diupload
        if (uploadedPhoto && userExists.profile?.avatar) {
            try {
                await deleteFile(userExists.profile.avatar);
            } catch (error) {
                console.error('Gagal menghapus file lama:', error);
            }
        }

        const [updatedUser] = await prisma.$transaction([
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
                where: { user_id : userId },
                data: {
                    full_name,
                    avatar,
                    updated_at: new Date()
                }
            })
        ]);

        responseData(res, 200, 'Data pengguna berhasil diperbarui', updatedUser);
    } catch (error) {
        console.error('Error in editUser:', error);
        responseData(res, 500, 'Terjadi kesalahan server');
    }
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