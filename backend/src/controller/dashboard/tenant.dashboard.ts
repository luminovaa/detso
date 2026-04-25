import { Request, Response, NextFunction } from "express";
import { prisma } from "../../utils/prisma";

export const getTenantDashboardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.tenant_id;

        if (!tenantId) {
            res.status(400).json({ message: "Tenant ID tidak ditemukan" });
            return;
        }

        // 1. Key Metrics
        const [totalCustomers, activeServices, openTickets, totalPackages] = await Promise.all([
            prisma.detso_Customer.count({
                where: { tenant_id: tenantId, deleted_at: null }
            }),
            prisma.detso_Service_Connection.count({
                where: { tenant_id: tenantId, deleted_at: null, status: 'ACTIVE' }
            }),
            prisma.detso_Ticket.count({
                where: { tenant_id: tenantId, deleted_at: null, status: 'OPEN' }
            }),
            prisma.detso_Package.count({
                where: { tenant_id: tenantId, deleted_at: null }
            }),
        ]);

        // 2. Recent Tickets (10 terbaru)
        const recentTickets = await prisma.detso_Ticket.findMany({
            where: { tenant_id: tenantId, deleted_at: null },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                priority: true,
                status: true,
                created_at: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    }
                },
                technician: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                full_name: true,
                                avatar: true,
                            }
                        }
                    }
                }
            }
        });

        // 3. Recent Customers (10 terbaru)
        const recentCustomers = await prisma.detso_Customer.findMany({
            where: { tenant_id: tenantId, deleted_at: null },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                created_at: true,
                _count: {
                    select: {
                        service: { where: { deleted_at: null } }
                    }
                }
            }
        });

        res.status(200).json({
            message: "Success fetching tenant dashboard data",
            data: {
                metrics: {
                    total_customers: totalCustomers,
                    active_services: activeServices,
                    open_tickets: openTickets,
                    total_packages: totalPackages,
                },
                recent_tickets: recentTickets,
                recent_customers: recentCustomers,
            }
        });
    } catch (error) {
        next(error);
    }
};
