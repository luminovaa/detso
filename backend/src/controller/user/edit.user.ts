import { Request, Response } from 'express';
import { updatePasswordSchema, updateUserSchema } from './validation/validation.user';
import { asyncHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import bcrypt from 'bcryptjs';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { prisma } from '../../utils/prisma';
import { Detso_Role } from '@prisma/client';

export const editUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Ambil Context User Login
    const currentUser = req.user;
    const myRole = currentUser?.role as Detso_Role;
    const isSuperAdmin = myRole === Detso_Role.SAAS_SUPER_ADMIN;
    
    const targetUserId = req.params.id;

    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(err => console.error('Gagal menghapus file:', err));
        }
    };

    // [UPDATED] 2. Cari Target User
    // Logic: Jika Super Admin, abaikan tenant_id. Jika Tenant Staff, wajib filter tenant_id.
    const whereClause: any = {
        id: targetUserId,
        deleted_at: null
    };

    if (!isSuperAdmin) {
        if (!currentUser?.tenant_id) throw new AuthenticationError('Tenant ID missing');
        whereClause.tenant_id = currentUser.tenant_id;
    }

    const targetUser = await prisma.detso_User.findFirst({
        where: whereClause,
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            phone: true,
            profile: { select: { avatar: true } }
        }
    });

    if (!targetUser) {
        await cleanupUploadedFile();
        throw new NotFoundError('Pengguna tidak ditemukan atau akses ditolak');
    }

    // 3. Logic Authorization
    const isSelf = currentUser?.id === targetUserId;
    const isOwner = myRole === Detso_Role.TENANT_OWNER;
    const isAdmin = myRole === Detso_Role.TENANT_ADMIN;

    // A. Jika edit orang lain
    if (!isSelf && !isSuperAdmin) { // Super Admin boleh edit siapa aja
        // Teknisi dilarang edit orang lain
        if (!isOwner && !isAdmin) {
            await cleanupUploadedFile();
            throw new AuthorizationError('Anda tidak memiliki izin untuk mengedit pengguna lain');
        }
        // Admin dilarang edit Owner
        if (isAdmin && targetUser.role === Detso_Role.TENANT_OWNER) {
            await cleanupUploadedFile();
            throw new AuthorizationError('Admin tidak dapat mengubah data Owner');
        }
    }
    
    // Handle File Upload
   let uploadedPhoto: { path: string; fileName: string; fullPath: string } | undefined;
    if (req.file) uploadedPhoto = getUploadedFileInfo(req.file, 'storage/image/profile');

    const validationResult = updateUserSchema.safeParse({ ...req.body, avatar: uploadedPhoto?.path });
    if (!validationResult.success) {
        await cleanupUploadedFile();
        throw new ValidationError('Validasi Gagal', validationResult.error.errors);
    }
    const { email, username, role, full_name, avatar, phone } = validationResult.data;


    // [UPDATED] 4. Logic Perubahan Role
    let newRole = targetUser.role; 

    if ((isOwner || isAdmin || isSuperAdmin) && role) {
        // Admin Tenant tidak boleh menaikkan jadi Owner
        if (isAdmin && role === Detso_Role.TENANT_OWNER) {
            await cleanupUploadedFile();
            throw new AuthorizationError('Admin tidak dapat mengubah role menjadi Owner');
        }
        newRole = role as Detso_Role;
    }
    // Jika User biasa edit diri sendiri, abaikan input role dari frontend

    // Hapus foto lama jika ada upload baru
    if (uploadedPhoto && targetUser.profile?.avatar) {
        await deleteFile(targetUser.profile.avatar).catch(error =>
            console.error('Gagal menghapus file lama:', error)
        );
    }

    // Update Database
    const [updatedUser, updatedProfile] = await prisma.$transaction([
        prisma.detso_User.update({
            where: { id: targetUserId },
            data: {
                email,
                username,
                phone,
                role: newRole, // Gunakan role yang sudah divalidasi logic di atas
                updated_at: new Date()
            },
            select: {
                id: true,
                email: true,
                username: true,
                phone: true,
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
            where: { user_id: targetUserId },
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
    // 1. Ambil User Login
    const currentUser = req.user;
    if (!currentUser?.id) {
        throw new AuthenticationError('User belum login');
    }
    const userId = currentUser.id;

    // 2. Validasi Input
    const validationResult = updatePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ValidationError('Validasi Gagal', validationResult.error.errors);
    }

    const { oldPassword, password } = validationResult.data;

    // 3. Ambil data password lama user
    // (Tenant ID implisit aman karena ambil by ID dari token sendiri)
    const user = await prisma.detso_User.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
    });

    if (!user) {
        throw new NotFoundError('Pengguna tidak ditemukan');
    }

    // 4. Verifikasi Password Lama (WAJIB untuk self-change)
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        throw new AuthenticationError('Password lama salah');
    }

    // 5. Update Password Baru
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.detso_User.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            updated_at: new Date()
        }
    });

    // Opsional: Revoke semua session lain agar mereka harus login ulang dengan password baru
    // await prisma.detso_Refresh_Token.updateMany(...)

    responseData(res, 200, 'Password berhasil diperbarui');
});
