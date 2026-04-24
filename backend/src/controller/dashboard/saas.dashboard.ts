import { Request, Response, NextFunction } from "express";
import { prisma } from "../../utils/prisma";

export const getSaasDashboardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Key Metrics
        const totalTenants = await prisma.detso_Tenant.count({
            where: { deleted_at: null }
        });

        const activeTenants = await prisma.detso_Tenant.count({
            where: { deleted_at: null, is_active: true }
        });

        const inactiveTenants = totalTenants - activeTenants;

        const totalCustomers = await prisma.detso_Customer.count({
            where: { deleted_at: null }
        });

        // 2. Global Map Data (All tenants with coordinates)
        const mapData = await prisma.detso_Tenant.findMany({
            where: {
                deleted_at: null,
                lat: { not: null },
                long: { not: null }
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                lat: true,
                long: true,
                phone: true,
                _count: {
                    select: { 
                        customers: { where: { deleted_at: null } },
                        users: { where: { deleted_at: null } }
                    }
                }
            }
        });

        // 4. Recent Activities (Recently joined ISPs)
        const recentTenants = await prisma.detso_Tenant.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                is_active: true,
                created_at: true,
                logo: true,
                _count: {
                    select: { 
                        customers: { where: { deleted_at: null } },
                        users: { where: { deleted_at: null } }
                    }
                }
            }
        });

        res.status(200).json({
            message: "Success fetching SAAS dashboard data",
            data: {
                metrics: {
                    total_tenants: totalTenants,
                    active_tenants: activeTenants,
                    inactive_tenants: inactiveTenants,
                    total_customers: totalCustomers
                },
                map_data: mapData,
                recent_activities: recentTenants
            }
        });
    } catch (error) {
        next(error);
    }
};
