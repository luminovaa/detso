import { Request, Response } from 'express';
import { Detso_Role } from '@prisma/client';
import { asyncHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { updateTenantSchema } from './validation/validation.tenant';
import { generateFullUrl } from '../../utils/generate-full-url';

// Helper slug sederhana
const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export const editTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Ambil Context User
    const user = req.user;
    if (!user) throw new AuthenticationError('Sesi tidak valid');

    const tenant_idToEdit = req.params.id;
    const isSuperAdmin = user.role === Detso_Role.SAAS_SUPER_ADMIN;
    const isOwner = user.role === Detso_Role.TENANT_OWNER;

    // 2. Authorization Check
    // Hanya Super Admin ATAU Owner dari tenant tersebut yang boleh edit
    if (!isSuperAdmin) {
        if (!isOwner) {
            throw new AuthorizationError('Hanya Owner yang dapat mengedit profil perusahaan');
        }
        // IDOR Protection: Owner ISP A tidak boleh edit ISP B
        if (user.tenant_id !== tenant_idToEdit) {
            throw new AuthorizationError('Anda tidak memiliki akses ke tenant ini');
        }
    }

    // 3. Handle File Upload (Logo)
    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(console.error);
        }
    };

    let uploadedLogo: { path: string; fileName: string } | undefined;
    if (req.file) {
        uploadedLogo = getUploadedFileInfo(req.file, 'storage/public/tenants/logo');
    }

    // 4. Validasi Input
    const validationResult = updateTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
        await cleanupUploadedFile();
        throw new ValidationError('Validasi Gagal', validationResult.error.errors);
    }

    const { name, address, phone, is_active, lat, long } = validationResult.data;

    // 5. Cek Data Existing
    const existingTenant = await prisma.detso_Tenant.findUnique({
        where: { id: tenant_idToEdit, deleted_at: null }
    });

    if (!existingTenant) {
        await cleanupUploadedFile();
        throw new NotFoundError('Tenant tidak ditemukan');
    }

    try {
        const updateData: any = {
            updated_at: new Date()
        };

        // --- Logic Update Fields ---

        // A. Update Nama (dan Slug otomatis)
        if (name && name !== existingTenant.name) {
            const newSlug = createSlug(name);
            
            // Cek Duplikasi Nama/Slug Global (Antar Tenant)
            const duplicateCheck = await prisma.detso_Tenant.findFirst({
                where: {
                    OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug: newSlug }],
                    id: { not: tenant_idToEdit }, // Jangan hitung diri sendiri
                    deleted_at: null
                }
            });

            if (duplicateCheck) {
                throw new ValidationError('Nama perusahaan sudah digunakan oleh ISP lain');
            }

            updateData.name = name;
            updateData.slug = newSlug;
        }

        // B. Update Info Dasar
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (lat !== undefined) updateData.lat = lat;
        if (long !== undefined) updateData.long = long;

        // C. Update Status (HANYA SUPER ADMIN)
        if (is_active !== undefined) {
            if (!isSuperAdmin) {
                throw new AuthorizationError('Hanya Super Admin yang dapat mengubah status aktifasi');
            }
            updateData.is_active = is_active === 'true';
        }

        // D. Update Logo
        if (uploadedLogo) {
            updateData.logo = uploadedLogo.path;
        }

        // 6. Eksekusi Update ke Database
        const updatedTenant = await prisma.detso_Tenant.update({
            where: { id: tenant_idToEdit },
            data: updateData
        });

        // 7. Cleanup: Hapus logo lama jika sukses upload logo baru
        if (uploadedLogo && existingTenant.logo) {
            await deleteFile(existingTenant.logo).catch(err => 
                console.error('Gagal menghapus logo lama:', err)
            );
        }

        // Format URL Logo untuk response
        const responseTenant = {
            ...updatedTenant,
            logo: generateFullUrl(updatedTenant.logo)
        };

        responseData(res, 200, 'Profil Tenant berhasil diperbarui', responseTenant);

    } catch (error) {
        // Jika error, hapus file logo yang baru saja diupload agar tidak nyampah
        await cleanupUploadedFile();
        throw error;
    }
});