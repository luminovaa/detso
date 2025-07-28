import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { updatePasswordSchema, updateUserSchema } from './validation/validation.user'
import { asyncHandler } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { cloudinary, getMulterUpload } from '../../../config/cloudinary'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient();
const uploadProfilePhoto = getMulterUpload('user-profiles').single('photo');

export const editUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    uploadProfilePhoto(req, res, async (err) => {
        if (err) {
            responseData(res, 400, 'Gagal mengupload gambar', { error: err.message });
            return;
        }

        const userId = req.params.id;
        const currentUser = req.user;
        const file = req.file as any;
        const isAdmin = currentUser?.role === 'ADMIN';

        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                profile: {
                    select: { photoUrl: true, publicPhotoId: true }
                }
            }
        });

        if (!userExists) {
            responseData(res, 404, 'Pengguna tidak ditemukan');
            return;
        }

        if (!isAdmin && currentUser?.id !== userId) {
            responseData(res, 403, 'Anda tidak memiliki izin untuk mengedit pengguna ini');
            return;
        }

        const newPhotoUrl = file?.path;
        const newPublicId = file?.filename;

        const validationResult = updateUserSchema.safeParse({
            ...req.body,
            photoUrl: newPhotoUrl
        });

        if (!validationResult.success) {
            if (newPublicId) {
                await cloudinary.uploader.destroy(newPublicId);
            }
            responseData(res, 400, 'Validasi Gagal', validationResult.error.format());
            return;
        }

        const { email, username, role, bio, name, photoUrl } = validationResult.data;

        if (!userExists) {
            if (newPublicId) {
                await cloudinary.uploader.destroy(newPublicId);
            }
            responseData(res, 404, 'Pengguna tidak ditemukan');
            return;
        }

        if (!isAdmin && currentUser?.id !== userId) {
            if (newPublicId) {
                await cloudinary.uploader.destroy(newPublicId);
            }
            responseData(res, 403, 'Anda tidak memiliki izin untuk mengedit pengguna ini');
            return;
        }

        if (userExists.email === email && currentUser?.id !== userId) {
            if (newPublicId) {
                await cloudinary.uploader.destroy(newPublicId);
            }
            responseData(res, 409, 'Email sudah digunakan oleh pengguna lain');
            return;
        }

        if (userExists.username === username && currentUser?.id !== userId) {
            if (newPublicId) {
                await cloudinary.uploader.destroy(newPublicId);
            }
            responseData(res, 409, 'Username sudah digunakan oleh pengguna lain');
            return;
        }


        const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    email,
                    username,
                    role: isAdmin ? role : undefined,
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    profile: {
                        select: {
                            id: true,
                            bio: true,
                            name: true,
                            photoUrl: true
                        }
                    }
                }
            }),
            prisma.profile.update({
                where: { userId },
                data: {
                    bio,
                    name,
                    photoUrl,
                    createdAt: new Date(),
                    publicPhotoId: newPublicId
                }
            })
        ]);

        responseData(res, 200, 'Data pengguna berhasil diperbarui', updatedUser);
    });
});

export const editUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const currentUser = req.user;

    const isAdmin = currentUser?.role === 'ADMIN';

    const validationResult = updatePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
        responseData(res, 400, 'Validasi Gagal', validationResult.error.format());
        return;
    }

    const { oldPassword, password } = validationResult.data

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
    })

    if (!user) {
        responseData(res, 404, 'Penggguna tidak ditemukan');
        return;
    }

    if (!isAdmin && currentUser?.id !== userId) {
        responseData(res, 403, 'Anda tidak memliki izin untuk mengedit pengguna ini');
        return;
    }

    if (!isAdmin) {
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            responseData(res, 401, 'Password lama tidak valid');
            return;
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    responseData(res, 200, 'Password berhasil diperbarui')
})