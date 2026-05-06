/**
 * Monitoring Service
 * 
 * Business logic for Mikrotik monitoring operations
 */

import { prisma } from '../../utils/prisma';
import { log } from '../../config/logger.config';
import { decryptPassword } from '../../utils/encryption';

export class MonitoringService {
  /**
   * Poll a single router and store monitoring data
   */
  async pollRouter(routerId: string): Promise<void> {
    try {
      // Get router config from database
      const router = await prisma.detso_Mikrotik_Router.findUnique({
        where: { id: routerId, deleted_at: null },
      });

      if (!router || !router.is_active) {
        log.debug('Router not found or inactive', { routerId });
        return;
      }

      // Create fresh connection for each poll (avoids !empty reply corruption)
      const { MikrotikService } = await import('./mikrotik.service');
      const service = new MikrotikService({
        host: router.host,
        port: router.api_port,
        username: router.api_username,
        password: decryptPassword(router.api_password),
        timeout: 15,
      });

      try {
        await service.connect();

        // Fetch system resources (required)
        const resource = await service.getSystemResource();
        
        // Fetch interfaces - wrap in try/catch because some CHR versions
        // return !empty which crashes node-routeros
        let interfaces: any[] = [];
        try {
          interfaces = await service.getInterfaces();
        } catch (e) {
          log.debug('Failed to fetch interfaces', { routerId, error: String(e) });
        }
        
        const pppoeSessions: any[] = [];
        const health: any = null;

        // Store monitoring data
        // Note: Mikrotik API returns all values as strings, so we need to parse them
        const cpuLoad = parseFloat(String(resource['cpu-load'])) || 0;
        const totalMemory = parseInt(String(resource['total-memory']), 10) || 0;
        const freeMemory = parseInt(String(resource['free-memory']), 10) || 0;
        const totalDisk = parseInt(String(resource['total-hdd-space']), 10) || 0;
        const freeDisk = parseInt(String(resource['free-hdd-space']), 10) || 0;

        await prisma.detso_Mikrotik_Monitoring.create({
          data: {
            router_id: routerId,
            cpu_load: cpuLoad,
            memory_used: BigInt(totalMemory - freeMemory),
            memory_total: BigInt(totalMemory),
            disk_used: BigInt(totalDisk - freeDisk),
            disk_total: BigInt(totalDisk),
            uptime: String(resource.uptime || ''),
            active_sessions: pppoeSessions.length,
            temperature: health?.temperature ? parseFloat(String(health.temperature)) : null,
            voltage: health?.voltage ? parseFloat(String(health.voltage)) : null,
          },
        });

        // Store interface data
        // Note: Mikrotik API returns all values as strings
        const interfaceRecords = interfaces
          .filter((iface: any) => iface.type !== 'loopback') // Skip loopback
          .map((iface: any) => {
            return {
              router_id: routerId,
              interface_name: String(iface.name || ''),
              interface_type: String(iface.type || ''),
              mac_address: iface['mac-address'] ? String(iface['mac-address']) : null,
              mtu: iface.mtu ? parseInt(String(iface.mtu), 10) : null,
              is_running: iface.running === 'true' || iface.running === true,
              is_disabled: iface.disabled === 'true' || iface.disabled === true,
              rx_bytes: BigInt(String(iface['rx-byte'] || '0')),
              tx_bytes: BigInt(String(iface['tx-byte'] || '0')),
              rx_packets: BigInt(String(iface['rx-packet'] || '0')),
              tx_packets: BigInt(String(iface['tx-packet'] || '0')),
              rx_errors: parseInt(String(iface['rx-error'] || '0'), 10),
              tx_errors: parseInt(String(iface['tx-error'] || '0'), 10),
              rx_drops: parseInt(String(iface['rx-drop'] || '0'), 10),
              tx_drops: parseInt(String(iface['tx-drop'] || '0'), 10),
              rx_bps: BigInt(0), // Traffic monitoring disabled for now
              tx_bps: BigInt(0),
            };
          });

        if (interfaceRecords.length > 0) {
          await prisma.detso_Mikrotik_Interface.createMany({
            data: interfaceRecords,
          });
        }

        // Update router status
        await prisma.detso_Mikrotik_Router.update({
          where: { id: routerId },
          data: {
            is_online: true,
            last_seen_at: new Date(),
            board_name: String(resource['board-name'] || ''),
            routeros_version: String(resource.version || ''),
            architecture: String(resource['architecture-name'] || ''),
            cpu_model: String(resource.cpu || ''),
            cpu_count: parseInt(String(resource['cpu-count']), 10) || null,
          },
        });

        log.debug('Router polled successfully', {
          routerId,
          cpu: resource['cpu-load'],
          memory: `${((resource['total-memory'] - resource['free-memory']) / resource['total-memory'] * 100).toFixed(1)}%`,
          sessions: pppoeSessions.length,
        });
      } finally {
        // Always disconnect after polling to avoid connection corruption
        await service.disconnect();
      }
    } catch (error) {
      log.error('Failed to poll router', {
        routerId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark router as offline
      await prisma.detso_Mikrotik_Router.update({
        where: { id: routerId },
        data: { is_online: false },
      }).catch(() => {});
    }
  }

  /**
   * Get current router status
   */
  async getRouterStatus(routerId: string) {
    const router = await prisma.detso_Mikrotik_Router.findUnique({
      where: { id: routerId, deleted_at: null },
    });

    if (!router) {
      throw new Error('Router not found');
    }

    // Get latest monitoring data
    const latestMonitoring = await prisma.detso_Mikrotik_Monitoring.findFirst({
      where: { router_id: routerId },
      orderBy: { recorded_at: 'desc' },
    });

    // Get latest interface data
    const latestInterfaces = await prisma.detso_Mikrotik_Interface.findMany({
      where: {
        router_id: routerId,
        recorded_at: latestMonitoring?.recorded_at || new Date(),
      },
    });

    return {
      router,
      monitoring: latestMonitoring,
      interfaces: latestInterfaces,
    };
  }

  /**
   * Get historical monitoring data
   */
  async getHistoricalData(routerId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await prisma.detso_Mikrotik_Monitoring.findMany({
      where: {
        router_id: routerId,
        recorded_at: { gte: since },
      },
      orderBy: { recorded_at: 'asc' },
    });

    return data;
  }

  /**
   * Cleanup old monitoring data (older than retention period)
   */
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    log.info('Cleaning up old monitoring data', { cutoffDate, retentionDays });

    const [monitoringDeleted, interfaceDeleted] = await Promise.all([
      prisma.detso_Mikrotik_Monitoring.deleteMany({
        where: { recorded_at: { lt: cutoffDate } },
      }),
      prisma.detso_Mikrotik_Interface.deleteMany({
        where: { recorded_at: { lt: cutoffDate } },
      }),
    ]);

    log.info('Cleanup completed', {
      monitoringRecords: monitoringDeleted.count,
      interfaceRecords: interfaceDeleted.count,
    });
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
