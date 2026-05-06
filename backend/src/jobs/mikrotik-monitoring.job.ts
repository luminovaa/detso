/**
 * Mikrotik Monitoring Background Worker
 * 
 * Polls all active routers every 15 seconds and stores monitoring data
 */

import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { log } from '../config/logger.config';
import { monitoringService } from '../services/mikrotik';

// Configuration
const POLL_INTERVAL = process.env.MIKROTIK_POLL_INTERVAL || '*/15 * * * * *'; // Every 15 seconds
const DATA_RETENTION_DAYS = parseInt(process.env.MIKROTIK_DATA_RETENTION_DAYS || '30', 10);

let isPolling = false;
let pollCount = 0;

/**
 * Poll all active routers
 */
async function pollAllRouters() {
  if (isPolling) {
    log.warn('Previous polling still in progress, skipping this cycle');
    return;
  }

  isPolling = true;
  const startTime = Date.now();

  try {
    // Get all active routers
    const routers = await prisma.detso_Mikrotik_Router.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        tenant_id: true,
      },
    });

    if (routers.length === 0) {
      log.debug('No active routers to poll');
      return;
    }

    log.debug('Starting router polling', { count: routers.length });

    // Poll all routers in parallel (with error handling per router)
    const results = await Promise.allSettled(
      routers.map(router => monitoringService.pollRouter(router.id))
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const duration = Date.now() - startTime;
    pollCount++;

    log.info('Router polling completed', {
      total: routers.length,
      successful,
      failed,
      duration: `${duration}ms`,
      pollCount,
    });

    // Emit Socket.IO event for real-time updates (will be implemented)
    if (global.io) {
      routers.forEach(router => {
        global.io.to(`tenant:${router.tenant_id}`).emit('mikrotik:polled', {
          router_id: router.id,
          timestamp: new Date().toISOString(),
        });
      });
    }
  } catch (error) {
    log.error('Error in polling cycle', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    isPolling = false;
  }
}

/**
 * Cleanup old monitoring data
 */
async function cleanupOldData() {
  try {
    log.info('Starting monitoring data cleanup', { retentionDays: DATA_RETENTION_DAYS });
    await monitoringService.cleanupOldData(DATA_RETENTION_DAYS);
  } catch (error) {
    log.error('Error in cleanup job', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Start monitoring worker
 */
export function startMonitoringWorker() {
  log.info('Starting Mikrotik monitoring worker', {
    pollInterval: POLL_INTERVAL,
    dataRetention: `${DATA_RETENTION_DAYS} days`,
  });

  // Poll routers every 15 seconds
  cron.schedule(POLL_INTERVAL, () => {
    pollAllRouters();
  });

  // Cleanup old data daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    cleanupOldData();
  });

  // Initial poll after 5 seconds
  setTimeout(() => {
    pollAllRouters();
  }, 5000);

  log.info('Mikrotik monitoring worker started successfully');
}

/**
 * Get worker statistics
 */
export function getWorkerStats() {
  return {
    isPolling,
    pollCount,
    pollInterval: POLL_INTERVAL,
    dataRetentionDays: DATA_RETENTION_DAYS,
  };
}
