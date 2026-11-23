import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler'; // Tambah AuthenticationError
import { responseData } from '../../utils/response-handler';
import { createTicketSchema } from './validation/validation.ticket';
import { prisma } from '../../utils/prisma';
import { trimOrNull } from '../../utils/request.utils';

export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenant_id = user.tenant_id;

    const validationResult = createTicketSchema.safeParse(req.body);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.issues);
    }

    const created_by = user.id; // Gunakan user.id dari middleware
    const {
        service_id: rawServiceId,
        customer_id: rawCustomerId,
        title,
        description,
        priority,
        assigned_to,
        type,
    } = validationResult.data;
    const service_id = trimOrNull(rawServiceId);
    const inputCustomerId = trimOrNull(rawCustomerId);
    // TENANT_TEKNISI hanya melihat & membuat tiket yang ditugaskan ke dirinya sendiri
    const effectiveAssignedTo = user.role === 'TENANT_TEKNISI' ? user.id : trimOrNull(assigned_to);

    let customer_id: string;
    let technicianData: { id: string; username: string; profile: { full_name: string } } | null = null;

    // [NEW] 2. Validasi Layanan atau Pelanggan langsung (untuk pelanggan lama tanpa paket)
    if (service_id) {
        const service = await prisma.detso_Service_Connection.findFirst({
            where: {
                id: service_id,
                tenant_id: tenant_id, // <--- Filter Tenant
                deleted_at: null
            },
            select: { id: true, customer_id: true }
        });

        if (!service) {
            throw new NotFoundError('Layanan tidak ditemukan atau akses ditolak');
        }

        customer_id = service.customer_id;
    } else if (inputCustomerId) {
        const customer = await prisma.detso_Customer.findFirst({
            where: {
                id: inputCustomerId,
                tenant_id: tenant_id,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!customer) {
            throw new NotFoundError('Pelanggan tidak ditemukan atau akses ditolak');
        }

        customer_id = customer.id;
    } else {
        throw new ValidationError('Layanan atau pelanggan harus dipilih');
    }

    // [NEW] 3. Validasi Teknisi (Wajib Karyawan Tenant)
    if (effectiveAssignedTo) {
        const technician = await prisma.detso_User.findFirst({
            where: {
                id: effectiveAssignedTo,
                tenant_id: tenant_id, // <--- Filter Tenant
                deleted_at: null
            },
            include: {
                profile: {
                    select: {
                        full_name: true,
                    }
                }
            }
        });

        if (!technician) {
            throw new NotFoundError('Teknisi tidak ditemukan di perusahaan Anda');
        }

        technicianData = {
            id: technician.id,
            username: technician.username,
            profile: {
                full_name: technician.profile?.full_name || 'Tidak ada nama'
            }
        };
    }

    // Buat ticket dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
        // [NEW] 4. Create Ticket (Inject tenant_id)
        const ticket = await tx.detso_Ticket.create({
            data: {
                tenant_id: tenant_id, // <--- Inject Tenant
                customer_id,
                service_id: service_id || null,
                title,
                description: description || '',
                priority,
                assigned_to: effectiveAssignedTo || null,
                status: 'OPEN',
                type,
                created_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                service: { select: { id: true, id_pel: true, package_name: true } },
                technician: effectiveAssignedTo ? {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { full_name: true } }
                    }
                } : undefined
            }
        });

        // History tidak perlu tenant_id secara eksplisit (biasanya) karena ikut relasi tiket,
        // tapi di schema kamu sepertinya tidak ada field tenant_id di history.
        // Jika history TIDAK punya tenant_id, aman. Jika punya, harus diisi.
        const ticketHistory = await tx.detso_Ticket_History.create({
            data: {
                ticket_id: ticket.id,
                action: 'CREATED',
                description: `Ticket dibuat dengan status: OPEN, priority: ${priority}, type: ${type}`,
                created_by: created_by || null,
                created_at: new Date(),
            }
        });

        let schedule = null;
        if (effectiveAssignedTo && technicianData) {
            // [NEW] 5. Create Schedule (Inject tenant_id)
            schedule = await tx.detso_Work_Schedule.create({
                data: {
                    tenant_id: tenant_id, // <--- Inject Tenant (PENTING untuk fitur kalender)
                    technician_id: effectiveAssignedTo,
                    ticket_id: ticket.id,
                    start_time: new Date(),
                    status: 'SCHEDULED',
                }
            });

            await tx.detso_Ticket_History.create({
                data: {
                    ticket_id: ticket.id,
                    action: 'ASSIGNED',
                    description: `Ticket ditugaskan kepada teknisi: ${technicianData.profile.full_name} (${technicianData.username})`,
                    created_by: created_by || null,
                    created_at: new Date(),
                }
            });
        }

        return { ticket, ticketHistory, schedule, technicianData };
    });

    responseData(res, 201, 'Ticket berhasil dibuat', {
        ticket: {
            ...result.ticket,
            technician: result.technicianData ? {
                id: result.technicianData.id,
                username: result.technicianData.username,
                full_name: result.technicianData.profile.full_name
            } : null
        },
        schedule: result.schedule,
        history: result.ticketHistory
    });
});