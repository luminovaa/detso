/**
 * Mikrotik Monitoring Controller
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { successResponse } from '../../utils/response-handler';
import { NotFoundError, AuthorizationError } from '../../utils/error-handler';
import { monitoringService } from '../../services/mikrotik';
import { historicalDataQuerySchema } from './validation/validation.mikrotik';

/**
 * Get current monitoring data for a router
 * GET /api/mikrotik/monitoring/:router_id/current
 */
export const getCurrentMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router_id = req.params.router_id as string;
    const tenantId = req.user!.tenant_id;

    // Verify router belongs to tenant
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id: router_id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Get latest monitoring data
    const monitoring = await prisma.detso_Mikrotik_Monitoring.findFirst({
      where: { router_id },
      orderBy: { recorded_at: 'desc' },
    });

    // Get latest interface data
    const interfaces = await prisma.detso_Mikrotik_Interface.findMany({
      where: {
        router_id,
        recorded_at: monitoring?.recorded_at || new Date(),
      },
    });

    // Convert BigInt to string for JSON serialization
    const monitoringData = monitoring ? {
      ...monitoring,
      memory_used: monitoring.memory_used.toString(),
      memory_total: monitoring.memory_total.toString(),
      disk_used: monitoring.disk_used.toString(),
      disk_total: monitoring.disk_total.toString(),
    } : null;

    const interfacesData = interfaces.map(iface => ({
      ...iface,
      rx_bytes: iface.rx_bytes.toString(),
      tx_bytes: iface.tx_bytes.toString(),
      rx_packets: iface.rx_packets.toString(),
      tx_packets: iface.tx_packets.toString(),
      rx_bps: iface.rx_bps.toString(),
      tx_bps: iface.tx_bps.toString(),
    }));

    return res.json(successResponse('Berhasil mengambil data monitoring', {
      router: {
        id: router.id,
        name: router.name,
        is_online: router.is_online,
        last_seen_at: router.last_seen_at,
      },
      monitoring: monitoringData,
      interfaces: interfacesData,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical monitoring data
 * GET /api/mikrotik/monitoring/:router_id/history?hours=24
 */
export const getHistoricalMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router_id = req.params.router_id as string;
    const tenantId = req.user!.tenant_id;

    // Validate query params
    const { hours } = historicalDataQuerySchema.parse(req.query);

    // Verify router belongs to tenant
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id: router_id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Get historical data
    const data = await monitoringService.getHistoricalData(router_id, hours);

    // Convert BigInt to string
    const historicalData = data.map(record => ({
      ...record,
      memory_used: record.memory_used.toString(),
      memory_total: record.memory_total.toString(),
      disk_used: record.disk_used.toString(),
      disk_total: record.disk_total.toString(),
    }));

    return res.json(successResponse('Berhasil mengambil data historis', {
      router: {
        id: router.id,
        name: router.name,
      },
      hours,
      data: historicalData,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get interface statistics
 * GET /api/mikrotik/monitoring/:router_id/interfaces
 */
export const getInterfaceStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router_id = req.params.router_id as string;
    const tenantId = req.user!.tenant_id;

    // Verify router belongs to tenant
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id: router_id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Get latest interface data
    const latestTimestamp = await prisma.detso_Mikrotik_Interface.findFirst({
      where: { router_id },
      orderBy: { recorded_at: 'desc' },
      select: { recorded_at: true },
    });

    if (!latestTimestamp) {
      return res.json(successResponse('Belum ada data interface', {
        router: { id: router.id, name: router.name },
        interfaces: [],
      }));
    }

    const interfaces = await prisma.detso_Mikrotik_Interface.findMany({
      where: {
        router_id,
        recorded_at: latestTimestamp.recorded_at,
      },
      orderBy: { interface_name: 'asc' },
    });

    // Convert BigInt to string
    const interfacesData = interfaces.map(iface => ({
      ...iface,
      rx_bytes: iface.rx_bytes.toString(),
      tx_bytes: iface.tx_bytes.toString(),
      rx_packets: iface.rx_packets.toString(),
      tx_packets: iface.tx_packets.toString(),
      rx_bps: iface.rx_bps.toString(),
      tx_bps: iface.tx_bps.toString(),
    }));

    return res.json(successResponse('Berhasil mengambil data interface', {
      router: { id: router.id, name: router.name },
      interfaces: interfacesData,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Force poll a router (manual refresh)
 * POST /api/mikrotik/monitoring/:router_id/poll
 */
export const forcePollRouter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router_id = req.params.router_id as string;
    const tenantId = req.user!.tenant_id;

    // Verify router belongs to tenant
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id: router_id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Poll router
    await monitoringService.pollRouter(router_id);

    return res.json(successResponse('Router berhasil di-poll'));
  } catch (error) {
    next(error);
  }
};
