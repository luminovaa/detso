import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler'; // Tambah AuthenticationError
import { responseData } from '../../utils/response-handler';
import { createTicketSchema } from './validation/validation.ticket';
import { prisma } from '../../utils/prisma';

export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id;

    const validationResult = createTicketSchema.safeParse(req.body);

    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const created_by = user.id; // Gunakan user.id dari middleware
    const { service_id, title, description, priority, assigned_to, type } = validationResult.data;

    let customer_id: string;
    let technicianData: { id: string; username: string; profile: { full_name: string } } | null = null;

    // [NEW] 2. Validasi Layanan (Wajib Milik Tenant)
    if (service_id) {
        const service = await prisma.detso_Service_Connection.findFirst({
            where: {
                id: service_id,
                tenant_id: tenantId, // <--- Filter Tenant
                deleted_at: null
            },
            select: { id: true, customer_id: true }
        });

        if (!service) {
            throw new NotFoundError('Layanan tidak ditemukan atau akses ditolak');
        }

        customer_id = service.customer_id;
    } else {
        throw new ValidationError('Layanan (service_id) harus diisi untuk menentukan customer');
    }

    // [NEW] 3. Validasi Teknisi (Wajib Karyawan Tenant)
    if (assigned_to) {
        const technician = await prisma.detso_User.findFirst({
            where: {
                id: assigned_to,
                tenant_id: tenantId, // <--- Filter Tenant
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
                tenant_id: tenantId, // <--- Inject Tenant
                customer_id,
                service_id: service_id || null,
                title,
                description: description || '',
                priority,
                assigned_to: assigned_to || null,
                status: 'OPEN',
                type,
                created_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                service: { select: { id: true, id_pel: true, package_name: true } },
                technician: assigned_to ? {
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
        if (assigned_to && technicianData) {
            // [NEW] 5. Create Schedule (Inject tenant_id)
            schedule = await tx.detso_Work_Schedule.create({
                data: {
                    tenant_id: tenantId, // <--- Inject Tenant (PENTING untuk fitur kalender)
                    technician_id: assigned_to,
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