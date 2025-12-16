import { Request, Response } from 'express';
import { Detso_Role } from '@prisma/client';
import { asyncHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../../utils/error-handler'; // Pastikan ValidationError diimport
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';

export const deleteTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 1. Ambil Context User
    const user = req.user;
    if (!user) throw new AuthenticationError('Sesi tidak valid');

    // 2. Authorization Check (HANYA SUPER ADMIN)
    if (user.role !== Detso_Role.SAAS_SUPER_ADMIN) {
        throw new AuthorizationError('Hanya Super Admin yang dapat menghapus Tenant.');
    }

    const tenantIdToDelete = req.params.id;

    // 3. Cek Keberadaan Tenant
    const tenant = await prisma.detso_Tenant.findUnique({
        where: { 
            id: tenantIdToDelete, 
            deleted_at: null 
        },
        include: {
            _count: {
                select: {
                    users: true,
                    customers: true
                }
            }
        }
    });

    if (!tenant) {
        throw new NotFoundError('Tenant tidak ditemukan atau sudah dihapus');
    }

    // [NEW] 3.5. Validasi Status Aktif (Safety Latch)
    // Jika tenant masih aktif, tolak request penghapusan.
    if (tenant.is_active) {
        throw new ValidationError(
            'Gagal menghapus: Tenant ini masih berstatus AKTIF.', 
            [
                {
                    message: "Harap non-aktifkan status tenant terlebih dahulu melalui menu Edit sebelum menghapus.",
                    path: ["status"]
                }
            ]
        );
    }

    // 4. Proses Deletion (Soft Delete Transaction)
    await prisma.$transaction(async (tx) => {
        const now = new Date();

        // A. Soft Delete Tenant
        // (Kita tidak perlu set is_active false lagi karena sudah pasti false dari pengecekan di atas, 
        // tapi tidak apa-apa di-set lagi untuk konsistensi data history)
        await tx.detso_Tenant.update({
            where: { id: tenantIdToDelete },
            data: {
                deleted_at: now,
                is_active: false 
            }
        });

        // B. Soft Delete Semua User di Tenant ini
        await tx.detso_User.updateMany({
            where: { tenant_id: tenantIdToDelete },
            data: {
                deleted_at: now
            }
        });

        // C. Revoke Semua Session User Tenant ini
        const users = await tx.detso_User.findMany({
            where: { tenant_id: tenantIdToDelete },
            select: { id: true }
        });
        
        const userIds = users.map(u => u.id);

        if (userIds.length > 0) {
            await tx.detso_Refresh_Token.updateMany({
                where: { user_id: { in: userIds } },
                data: {
                    is_active: false,
                    revoked_at: now
                }
            });
        }
    });

    responseData(res, 200, 'Tenant berhasil dihapus (soft delete).', {
        id: tenant.id,
        name: tenant.name,
        deleted_at: new Date(),
        details: {
            users_deactivated: tenant._count.users,
            customers_archived: tenant._count.customers
        }
    });
});