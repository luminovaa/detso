/**
 * Mikrotik API Service
 * 
 * Wrapper around node-routeros library for Mikrotik API communication
 */

import { RouterOSAPI } from 'node-routeros';
import { log } from '../../config/logger.config';
import type {
  MikrotikConnectionConfig,
  SystemResource,
  InterfaceInfo,
  InterfaceTraffic,
  PPPoESession,
  SystemHealth,
  SystemIdentity,
  MikrotikError,
} from './types';

export class MikrotikService {
  private conn: RouterOSAPI;
  private config: MikrotikConnectionConfig;
  private isConnected: boolean = false;

  constructor(config: MikrotikConnectionConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 10, // Default 10 seconds
    };

    this.conn = new RouterOSAPI({
      host: config.host,
      user: config.username,
      password: config.password,
      port: config.port,
      timeout: this.config.timeout,
    });
  }

  /**
   * Connect to Mikrotik router
   */
  async connect(): Promise<void> {
    try {
      await this.conn.connect();
      this.isConnected = true;
      log.info('Mikrotik connected', { host: this.config.host, port: this.config.port });
    } catch (error) {
      this.isConnected = false;
      const mikrotikError = this.handleError(error);
      log.error('Mikrotik connection failed', {
        host: this.config.host,
        port: this.config.port,
        error: mikrotikError.message,
        category: mikrotikError.category,
      });
      throw mikrotikError;
    }
  }

  /**
   * Disconnect from Mikrotik router
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.conn.close();
        this.isConnected = false;
        log.info('Mikrotik disconnected', { host: this.config.host });
      }
    } catch (error) {
      log.warn('Mikrotik disconnect warning', { error: String(error) });
    }
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get system resources (CPU, RAM, Disk, Uptime)
   */
  async getSystemResource(): Promise<SystemResource> {
    await this.ensureConnected();
    try {
      const result = await this.conn.write('/system/resource/print');
      return result[0] as SystemResource;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get system identity (router name)
   */
  async getSystemIdentity(): Promise<SystemIdentity> {
    await this.ensureConnected();
    try {
      const result = await this.conn.write('/system/identity/print');
      return result[0] as SystemIdentity;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all interfaces
   */
  async getInterfaces(): Promise<InterfaceInfo[]> {
    await this.ensureConnected();
    try {
      const result = await this.conn.write('/interface/print');
      return result as InterfaceInfo[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get interface traffic statistics
   */
  async getInterfaceTraffic(interfaceName?: string): Promise<InterfaceTraffic[]> {
    await this.ensureConnected();
    try {
      // Note: monitor-traffic requires interface name and returns single result
      // For now, return empty array as this command needs special handling
      return [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get active PPPoE sessions
   */
  async getPPPoEActiveSessions(): Promise<PPPoESession[]> {
    await this.ensureConnected();
    try {
      const result = await this.conn.write('/ppp/active/print');
      return (result || []) as PPPoESession[];
    } catch (error) {
      // If PPPoE is not configured or returns empty, return empty array
      if (error instanceof Error && (
        error.message.includes('no such command') ||
        error.message.includes('UNKNOWNREPLY') ||
        error.message.includes('!empty')
      )) {
        return [];
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get system health (temperature, voltage)
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    await this.ensureConnected();
    try {
      const result = await this.conn.write('/system/health/print');
      if (!result || result.length === 0) return null;
      return result[0] as SystemHealth;
    } catch (error) {
      // Not all hardware supports health monitoring
      if (error instanceof Error && (
        error.message.includes('no such command') ||
        error.message.includes('UNKNOWNREPLY') ||
        error.message.includes('!empty')
      )) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Test connection without throwing error
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.connect();
      await this.getSystemResource();
      return { success: true };
    } catch (error) {
      const mikrotikError = error as MikrotikError;
      return {
        success: false,
        error: mikrotikError.message,
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: unknown): MikrotikError {
    const err = error as Error;
    const mikrotikError: MikrotikError = new Error(err.message) as MikrotikError;
    mikrotikError.stack = err.stack;

    // Categorize error
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      mikrotikError.category = 'connection';
      mikrotikError.code = 'CONNECTION_FAILED';
    } else if (err.message.includes('cannot log in') || err.message.includes('invalid user')) {
      mikrotikError.category = 'authentication';
      mikrotikError.code = 'AUTH_FAILED';
    } else if (err.message.includes('timeout')) {
      mikrotikError.category = 'timeout';
      mikrotikError.code = 'TIMEOUT';
    } else if (err.message.includes('no such command')) {
      mikrotikError.category = 'command';
      mikrotikError.code = 'COMMAND_NOT_FOUND';
    } else {
      mikrotikError.category = 'unknown';
      mikrotikError.code = 'UNKNOWN_ERROR';
    }

    return mikrotikError;
  }

  /**
   * Get connection config (without password)
   */
  getConfig(): Omit<MikrotikConnectionConfig, 'password'> {
    return {
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      timeout: this.config.timeout,
    };
  }
}
