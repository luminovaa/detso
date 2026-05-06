/**
 * Mikrotik Connection Pool
 * 
 * Manages reusable connections to Mikrotik routers
 * Prevents creating too many connections and handles connection lifecycle
 */

import { MikrotikService } from './mikrotik.service';
import { log } from '../../config/logger.config';
import type { MikrotikConnectionConfig } from './types';

interface PooledConnection {
  service: MikrotikService;
  lastUsed: Date;
  inUse: boolean;
}

interface PoolConfig {
  maxConnections?: number;
  idleTimeout?: number; // milliseconds
  connectionTimeout?: number; // milliseconds
}

export class MikrotikConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: Required<PoolConfig>;

  constructor(config: PoolConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      idleTimeout: config.idleTimeout || 60000, // 1 minute
      connectionTimeout: config.connectionTimeout || 10000, // 10 seconds
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get or create a connection for a router
   */
  async getConnection(routerId: string, connectionConfig: MikrotikConnectionConfig): Promise<MikrotikService> {
    const existing = this.connections.get(routerId);

    // Reuse existing connection if available
    if (existing && !existing.inUse) {
      if (existing.service.getConnectionStatus()) {
        existing.inUse = true;
        existing.lastUsed = new Date();
        log.debug('Reusing Mikrotik connection', { routerId });
        return existing.service;
      } else {
        // Connection is dead, remove it
        this.connections.delete(routerId);
      }
    }

    // Check pool size limit
    if (this.connections.size >= this.config.maxConnections) {
      // Try to find and remove an idle connection
      const removed = this.removeIdleConnection();
      if (!removed) {
        throw new Error('Connection pool exhausted. Maximum connections reached.');
      }
    }

    // Create new connection
    log.debug('Creating new Mikrotik connection', { routerId });
    const service = new MikrotikService({
      ...connectionConfig,
      timeout: this.config.connectionTimeout / 1000, // Convert to seconds
    });

    await service.connect();

    this.connections.set(routerId, {
      service,
      lastUsed: new Date(),
      inUse: true,
    });

    return service;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(routerId: string): void {
    const connection = this.connections.get(routerId);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = new Date();
      log.debug('Released Mikrotik connection', { routerId });
    }
  }

  /**
   * Remove a specific connection
   */
  async removeConnection(routerId: string): Promise<void> {
    const connection = this.connections.get(routerId);
    if (connection) {
      await connection.service.disconnect();
      this.connections.delete(routerId);
      log.debug('Removed Mikrotik connection', { routerId });
    }
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    log.info('Closing all Mikrotik connections', { count: this.connections.size });
    
    const promises = Array.from(this.connections.entries()).map(async ([routerId, connection]) => {
      try {
        await connection.service.disconnect();
      } catch (error) {
        log.warn('Error closing connection', { routerId, error: String(error) });
      }
    });

    await Promise.all(promises);
    this.connections.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    idle: number;
    maxConnections: number;
  } {
    const inUse = Array.from(this.connections.values()).filter(c => c.inUse).length;
    return {
      total: this.connections.size,
      inUse,
      idle: this.connections.size - inUse,
      maxConnections: this.config.maxConnections,
    };
  }

  /**
   * Remove one idle connection
   */
  private removeIdleConnection(): boolean {
    for (const [routerId, connection] of this.connections.entries()) {
      if (!connection.inUse) {
        connection.service.disconnect().catch(() => {});
        this.connections.delete(routerId);
        log.debug('Removed idle connection to make space', { routerId });
        return true;
      }
    }
    return false;
  }

  /**
   * Cleanup idle connections periodically
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [routerId, connection] of this.connections.entries()) {
        if (!connection.inUse) {
          const idleTime = now - connection.lastUsed.getTime();
          if (idleTime > this.config.idleTimeout) {
            toRemove.push(routerId);
          }
        }
      }

      if (toRemove.length > 0) {
        log.info('Cleaning up idle Mikrotik connections', { count: toRemove.length });
        toRemove.forEach(routerId => {
          const connection = this.connections.get(routerId);
          if (connection) {
            connection.service.disconnect().catch(() => {});
            this.connections.delete(routerId);
          }
        });
      }
    }, 30000); // Check every 30 seconds
  }
}

// Singleton instance
export const mikrotikPool = new MikrotikConnectionPool({
  maxConnections: 20,
  idleTimeout: 60000, // 1 minute
  connectionTimeout: 10000, // 10 seconds
});
